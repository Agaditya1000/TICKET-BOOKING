// src/routes/shows.routes.ts
import { Router } from 'express';
import { createShow, listShows, getShowById } from '../controllers/shows.controller';

const router = Router();

/**
 * @swagger
 * /api/shows:
 *   post:
 *     summary: Create a new show/trip/slot (Admin)
 *     tags: [Shows]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - start_time
 *               - total_seats
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Morning Bus to Mumbai"
 *               start_time:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-12-25T08:00:00Z"
 *               total_seats:
 *                 type: integer
 *                 example: 40
 *     responses:
 *       201:
 *         description: Show created successfully
 *       400:
 *         description: Invalid input
 */
router.post('/', createShow);

/**
 * @swagger
 * /api/shows:
 *   get:
 *     summary: Get list of all available shows/trips
 *     tags: [Shows]
 *     responses:
 *       200:
 *         description: List of shows with availability
 */
router.get('/', listShows);

/**
 * @swagger
 * /api/shows/{id}:
 *   get:
 *     summary: Get show details with seat availability
 *     tags: [Shows]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Show details
 *       404:
 *         description: Show not found
 */
router.get('/:id', getShowById);

export default router;
