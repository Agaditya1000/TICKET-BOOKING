// src/routes/bookings.routes.ts
import { Router } from 'express';
import { createBooking, getBooking, confirmBooking } from '../controllers/bookings.controller';

const router = Router();

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create a new booking (PENDING status)
 *     tags: [Bookings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - show_id
 *               - seat_numbers
 *             properties:
 *               user_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *               show_id:
 *                 type: string
 *                 format: uuid
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               seat_numbers:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["1", "2", "3"]
 *     responses:
 *       201:
 *         description: Booking created (PENDING)
 *       400:
 *         description: Invalid input or seats not available
 */
router.post('/', createBooking);

/**
 * @swagger
 * /api/bookings/{id}:
 *   get:
 *     summary: Get booking details by ID
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Booking details
 *       404:
 *         description: Booking not found
 */
router.get('/:id', getBooking);

/**
 * @swagger
 * /api/bookings/{id}/confirm:
 *   post:
 *     summary: Confirm a pending booking (PENDING -> CONFIRMED)
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Booking confirmed
 *       400:
 *         description: Booking cannot be confirmed (expired or already processed)
 *       404:
 *         description: Booking not found
 */
router.post('/:id/confirm', confirmBooking);

export default router;
