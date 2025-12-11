// src/controllers/bookings.controller.ts
import { Request, Response } from 'express';
import { createBookingService, getBookingById, confirmBookingService } from '../services/booking.service';

export async function createBooking(req: Request, res: Response) {
  const { user_id, show_id, seat_numbers } = req.body;
  if (!show_id || !Array.isArray(seat_numbers) || seat_numbers.length === 0) {
    return res.status(400).json({ error: 'show_id and seat_numbers (array) are required' });
  }
  try {
    const booking = await createBookingService({ user_id, show_id, seat_numbers });
    if (booking.status === 'FAILED') {
      return res.status(400).json(booking);
    }
    res.status(201).json(booking);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || 'booking failed' });
  }
}

export async function getBooking(req: Request, res: Response) {
  const id = req.params.id;
  try {
    const booking = await getBookingById(id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'could not fetch booking' });
  }
}

export async function confirmBooking(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const booking = await confirmBookingService(id);
    res.json(booking);
  } catch (err: any) {
    console.error(err);
    const statusCode = err.message.includes('not found') ? 404 : 
                      err.message.includes('already') ? 400 : 500;
    res.status(statusCode).json({ error: err.message || 'could not confirm booking' });
  }
}
