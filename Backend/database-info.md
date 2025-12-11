# Database Information

## Database Connection
- **Database Name**: `ticketdb`
- **Host**: `localhost`
- **Port**: `5432`
- **User**: `postgres`
- **Connection String**: `postgresql://postgres:Aditya%40123@localhost:5432/ticketdb`

## Database Schema

### Tables

#### 1. `users`
- **Purpose**: Store user information (optional)
- **Columns**:
  - `id` (UUID, Primary Key)
  - `name` (TEXT, NOT NULL)
  - `email` (TEXT, UNIQUE)

#### 2. `shows`
- **Purpose**: Store show/trip/slot information
- **Columns**:
  - `id` (UUID, Primary Key)
  - `name` (TEXT, NOT NULL)
  - `start_time` (TIMESTAMP, NOT NULL)
  - `total_seats` (INT, NOT NULL)
  - `created_at` (TIMESTAMP, DEFAULT now())

#### 3. `seats`
- **Purpose**: Individual seat records with status tracking
- **Columns**:
  - `id` (UUID, Primary Key)
  - `show_id` (UUID, Foreign Key → shows.id)
  - `seat_number` (TEXT, NOT NULL)
  - `status` (TEXT, NOT NULL, DEFAULT 'AVAILABLE')
    - Values: `AVAILABLE`, `HELD`, `BOOKED`
  - `version` (INT, NOT NULL, DEFAULT 0) - For optimistic locking
  - `locked_until` (TIMESTAMP, NULL) - For booking expiry
- **Constraints**:
  - Unique constraint: `(show_id, seat_number)`

#### 4. `bookings`
- **Purpose**: Booking records
- **Columns**:
  - `id` (UUID, Primary Key)
  - `user_id` (UUID, Foreign Key → users.id, nullable)
  - `show_id` (UUID, Foreign Key → shows.id, NOT NULL)
  - `status` (TEXT, NOT NULL, DEFAULT 'PENDING')
    - Values: `PENDING`, `CONFIRMED`, `FAILED`
  - `created_at` (TIMESTAMP, DEFAULT now())
  - `updated_at` (TIMESTAMP, DEFAULT now())

#### 5. `booking_seats`
- **Purpose**: Many-to-many relationship between bookings and seats
- **Columns**:
  - `booking_id` (UUID, Foreign Key → bookings.id)
  - `seat_id` (UUID, Foreign Key → seats.id)
- **Constraints**:
  - Primary Key: `(booking_id, seat_id)`

## Indexes

1. `idx_seats_show_status` - On `seats(show_id, status)`
2. `idx_seats_locked_until` - On `seats(locked_until)` WHERE `locked_until IS NOT NULL`
3. `idx_bookings_status` - On `bookings(status)`
4. `idx_bookings_show_id` - On `bookings(show_id)`
5. `idx_bookings_created_at` - On `bookings(created_at)`
6. `idx_booking_seats_booking_id` - On `booking_seats(booking_id)`
7. `idx_booking_seats_seat_id` - On `booking_seats(seat_id)`

## Concurrency Control Features

1. **Optimistic Locking**: Version numbers on seats table
2. **Row-Level Locking**: `FOR UPDATE SKIP LOCKED` in queries
3. **Advisory Locks**: Per-show locks using `pg_advisory_xact_lock`
4. **Transaction Isolation**: Serializable isolation level
5. **Time-based Locks**: `locked_until` timestamp for temporary holds

## Current Data

To check current data, use the API endpoints:
- `GET /api/shows` - List all shows
- `GET /api/shows/:id` - Get show details with seats
- `GET /api/bookings/:id` - Get booking details

