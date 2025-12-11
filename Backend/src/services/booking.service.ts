// src/services/booking.service.ts
import { pool, getClient } from '../db';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
dotenv.config();

const HOLD_SECONDS = parseInt(process.env.BOOKING_HOLD_SECONDS || '120'); // 2 minutes

interface CreateBookingInput {
  user_id?: string | null;
  show_id: string;
  seat_numbers: string[];
}

export async function createBookingService(input: CreateBookingInput) {
  const { user_id = null, show_id, seat_numbers } = input;
  const MAX_RETRIES = 5;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    const client = await getClient();
    try {
      attempt++;
      await client.query('BEGIN');
      await client.query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');

      await client.query(`SELECT pg_advisory_xact_lock(hashtext($1)::bigint)`, [show_id]);

      const seatRes = await client.query(
        `SELECT id, seat_number, status, version, locked_until
         FROM seats
         WHERE show_id = $1 AND seat_number = ANY($2::text[])
         FOR UPDATE SKIP LOCKED
        `,
        [show_id, seat_numbers]
      );

      if (seatRes.rowCount !== seat_numbers.length) {
        await client.query('ROLLBACK');
        client.release();
        return {
          status: 'FAILED',
          reason: 'Some seats are not available (already locked or booked).'
        };
      }

      const nowRes = await client.query('SELECT NOW() as now');
      const now = nowRes.rows[0].now;

      const seatsToHold: { id: string; version: number }[] = [];
      for (const row of seatRes.rows) {
        const status = row.status;
        const lockedUntil = row.locked_until;
        if (status === 'BOOKED') {
          await client.query('ROLLBACK');
          client.release();
          return { status: 'FAILED', reason: 'Seat already booked' };
        }
        if (status === 'HELD' && lockedUntil && new Date(lockedUntil) > new Date(now)) {
          await client.query('ROLLBACK');
          client.release();
          return { status: 'FAILED', reason: 'Seat is held by another pending booking' };
        }
        seatsToHold.push({ id: row.id, version: row.version });
      }

      const bookingId = uuidv4();
      await client.query(
        `INSERT INTO bookings (id, user_id, show_id, status) VALUES ($1, $2, $3, 'PENDING')`,
        [bookingId, user_id, show_id]
      );

      const lockedUntil = new Date(Date.now() + HOLD_SECONDS * 1000).toISOString();

      for (const s of seatsToHold) {
        const updateRes = await client.query(
          `UPDATE seats
           SET status = 'HELD', locked_until = $1, version = version + 1
           WHERE id = $2 AND version = $3
           RETURNING *
          `,
          [lockedUntil, s.id, s.version]
        );

        if (updateRes.rowCount === 0) {
          throw new Error('Version conflict');
        }

        await client.query(
          `INSERT INTO booking_seats (booking_id, seat_id) VALUES ($1, $2)`,
          [bookingId, s.id]
        );
      }

      await client.query('COMMIT');
      client.release();
      return {
        id: bookingId,
        status: 'PENDING',
        expires_at: lockedUntil,
        seats: seat_numbers
      };

    } catch (err: any) {
      await client.query('ROLLBACK').catch(() => {});
      client.release();

      const msg = String(err.message || err);
      if (msg.includes('could not serialize access') || msg.includes('Version conflict') || msg.includes('deadlock detected')) {
        console.warn(`Attempt ${attempt} failed due to concurrency, retrying...`, msg);
        await sleep(100 * attempt);
        continue;
      }

      throw err;
    }
  }

  throw new Error('Could not acquire seats after retries');
}

export async function confirmBookingService(bookingId: string) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    await client.query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');

    // Check if booking exists and is PENDING
    const bookingRes = await client.query(
      `SELECT id, status, show_id FROM bookings WHERE id = $1 FOR UPDATE`,
      [bookingId]
    );

    if (bookingRes.rowCount === 0) {
      await client.query('ROLLBACK');
      client.release();
      throw new Error('Booking not found');
    }

    const booking = bookingRes.rows[0];
    if (booking.status !== 'PENDING') {
      await client.query('ROLLBACK');
      client.release();
      throw new Error(`Booking is already ${booking.status}`);
    }

    // Check if seats are still held and not expired
    const seatsRes = await client.query(
      `SELECT s.id, s.status, s.locked_until
       FROM seats s
       JOIN booking_seats bs ON bs.seat_id = s.id
       WHERE bs.booking_id = $1
      `,
      [bookingId]
    );

    const nowRes = await client.query('SELECT NOW() as now');
    const now = nowRes.rows[0].now;

    for (const seat of seatsRes.rows) {
      if (seat.status !== 'HELD') {
        await client.query('ROLLBACK');
        client.release();
        throw new Error('Seat is no longer held');
      }
      if (seat.locked_until && new Date(seat.locked_until) < new Date(now)) {
        await client.query('ROLLBACK');
        client.release();
        throw new Error('Booking has expired');
      }
    }

    // Update booking status to CONFIRMED
    await client.query(
      `UPDATE bookings SET status = 'CONFIRMED', updated_at = now() WHERE id = $1`,
      [bookingId]
    );

    // Update seats to BOOKED
    await client.query(
      `UPDATE seats
       SET status = 'BOOKED', locked_until = NULL
       WHERE id IN (
         SELECT seat_id FROM booking_seats WHERE booking_id = $1
       )
      `,
      [bookingId]
    );

    await client.query('COMMIT');
    client.release();

    return { id: bookingId, status: 'CONFIRMED' };
  } catch (err: any) {
    await client.query('ROLLBACK').catch(() => {});
    client.release();
    throw err;
  }
}

export async function getBookingById(id: string) {
  const res = await pool.query(
    `SELECT b.id, b.user_id, b.show_id, b.status, b.created_at, b.updated_at,
      json_agg(json_build_object('seat_id', s.id, 'seat_number', s.seat_number)) as seats
     FROM bookings b
     LEFT JOIN booking_seats bs ON bs.booking_id = b.id
     LEFT JOIN seats s ON s.id = bs.seat_id
     WHERE b.id = $1
     GROUP BY b.id
    `,
    [id]
  );
  return res.rows[0];
}

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}
