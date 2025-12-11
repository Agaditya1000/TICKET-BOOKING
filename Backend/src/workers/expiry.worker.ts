// src/workers/expiry.worker.ts
import { getClient } from '../db';
import dotenv from 'dotenv';
dotenv.config();

const POLL_INTERVAL = 10_000; // 10 seconds

async function expirePendingBookings() {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const q = `
      SELECT b.id as booking_id
      FROM bookings b
      JOIN booking_seats bs ON bs.booking_id = b.id
      JOIN seats s ON s.id = bs.seat_id
      WHERE b.status = 'PENDING' AND (s.locked_until IS NOT NULL AND s.locked_until < now())
      GROUP BY b.id
    `;
    const res = await client.query(q);

    if (res.rowCount === 0) {
      await client.query('COMMIT');
      client.release();
      return;
    }

    for (const row of res.rows) {
      const bookingId = row.booking_id;
      await client.query(
        `UPDATE bookings SET status = 'FAILED', updated_at = now() WHERE id = $1`,
        [bookingId]
      );

      await client.query(
        `UPDATE seats
         SET status = 'AVAILABLE', locked_until = NULL
         WHERE id IN (
           SELECT s.id FROM seats s
           JOIN booking_seats bs ON bs.seat_id = s.id
           WHERE bs.booking_id = $1 AND s.status = 'HELD' AND s.locked_until < now()
         )
        `,
        [bookingId]
      );
    }

    await client.query('COMMIT');

  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('expiry worker error', err);
  } finally {
    client.release();
  }
}

async function loop() {
  console.log('Starting expiry worker...');
  while (true) {
    try {
      await expirePendingBookings();
    } catch (err) {
      console.error('Worker loop error', err);
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL));
  }
}

if (require.main === module) {
  loop();
}
