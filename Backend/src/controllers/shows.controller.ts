// src/controllers/shows.controller.ts
import { Request, Response } from 'express';
import { pool } from '../db';

export async function createShow(req: Request, res: Response) {
  const { name, start_time, total_seats } = req.body;
  if (!name || !start_time || !total_seats) {
    return res.status(400).json({ error: 'name, start_time, total_seats required' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const showRes = await client.query(
      `INSERT INTO shows (name, start_time, total_seats) VALUES ($1, $2, $3) RETURNING *`,
      [name, start_time, total_seats]
    );
    const show = showRes.rows[0];

    const seatPromises = [];
    for (let i = 1; i <= total_seats; i++) {
      seatPromises.push(
        client.query(
          `INSERT INTO seats (show_id, seat_number) VALUES ($1, $2)`,
          [show.id, String(i)]
        )
      );
    }
    await Promise.all(seatPromises);
    await client.query('COMMIT');
    res.status(201).json({ show });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'could not create show' });
  } finally {
    client.release();
  }
}

export async function listShows(_req: Request, res: Response) {
  try {
    const r = await pool.query(
      `SELECT 
        s.id, 
        s.name, 
        s.start_time, 
        s.total_seats,
        COUNT(CASE WHEN st.status = 'AVAILABLE' THEN 1 END) as available_seats,
        COUNT(CASE WHEN st.status = 'BOOKED' THEN 1 END) as booked_seats
       FROM shows s
       LEFT JOIN seats st ON st.show_id = s.id
       GROUP BY s.id, s.name, s.start_time, s.total_seats
       ORDER BY s.start_time`
    );
    res.json(r.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'cannot fetch shows' });
  }
}

export async function getShowById(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const showRes = await pool.query(
      `SELECT 
        s.id, 
        s.name, 
        s.start_time, 
        s.total_seats,
        s.created_at,
        COUNT(CASE WHEN st.status = 'AVAILABLE' THEN 1 END) as available_seats,
        COUNT(CASE WHEN st.status = 'HELD' THEN 1 END) as held_seats,
        COUNT(CASE WHEN st.status = 'BOOKED' THEN 1 END) as booked_seats
       FROM shows s
       LEFT JOIN seats st ON st.show_id = s.id
       WHERE s.id = $1
       GROUP BY s.id, s.name, s.start_time, s.total_seats, s.created_at`,
      [id]
    );

    if (showRes.rowCount === 0) {
      return res.status(404).json({ error: 'Show not found' });
    }

    // Get available seat numbers
    const seatsRes = await pool.query(
      `SELECT seat_number, status 
       FROM seats 
       WHERE show_id = $1 
       ORDER BY CAST(seat_number AS INTEGER)`,
      [id]
    );

    res.json({
      ...showRes.rows[0],
      seats: seatsRes.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'cannot fetch show' });
  }
}
