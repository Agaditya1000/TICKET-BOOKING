// src/app.ts
import express from 'express';
import cors from 'cors';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import showsRouter from './routes/shows.routes';
import bookingsRouter from './routes/bookings.routes';

const app = express();
app.use(cors());
app.use(express.json());

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ticket Booking System API',
      version: '1.0.0',
      description: 'A high-concurrency ticket booking system API with race condition prevention',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 4000}`,
        description: 'Development server',
      },
    ],
  },
  apis: [__dirname + '/routes/*.ts', __dirname + '/controllers/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/shows', showsRouter);
app.use('/api/bookings', bookingsRouter);

app.get('/health', (_req, res) => res.json({ ok: true }));

export default app;
