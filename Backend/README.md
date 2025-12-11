# Ticket Booking System - Backend

A high-concurrency ticket booking system backend built with Node.js, Express.js, and PostgreSQL. This system handles concurrent booking requests while preventing race conditions and overbooking.

## Features

- ✅ **Show/Trip/Slot Management**: Admin can create shows with name, start time, and total seats
- ✅ **User Operations**: Users can list available shows and book seats
- ✅ **Concurrency Handling**: Prevents overbooking using database transactions, row-level locking, and optimistic locking
- ✅ **Booking Status Management**: Supports PENDING, CONFIRMED, and FAILED statuses
- ✅ **Automatic Booking Expiry**: PENDING bookings expire after 2 minutes (configurable)
- ✅ **API Documentation**: Swagger/OpenAPI documentation available at `/api-docs`

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Language**: TypeScript

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd "TICKET BOOKING/Backend"
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

Install and start PostgreSQL on your system, then create a database:

```sql
CREATE DATABASE ticketdb;
```

**For Windows:**
- Download PostgreSQL from https://www.postgresql.org/download/windows/
- Install and start the PostgreSQL service
- Use pgAdmin or psql to create the database

**For Linux:**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres psql -c "CREATE DATABASE ticketdb;"
```

**For macOS:**
```bash
brew install postgresql
brew services start postgresql
createdb ticketdb
```

### 4. Run Migrations

```bash
# Windows (PowerShell)
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ticketdb"
psql $env:DATABASE_URL -f migrations/001_create_tables.sql

# Or manually (replace with your PostgreSQL username and password)
psql -U postgres -d ticketdb -f migrations/001_create_tables.sql

# Linux/macOS
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ticketdb"
psql $DATABASE_URL -f migrations/001_create_tables.sql

# Or manually
psql -U postgres -d ticketdb -f migrations/001_create_tables.sql
```

### 5. Environment Configuration

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ticketdb
PORT=4000
BOOKING_HOLD_SECONDS=120
```

### 6. Start the Server

#### Development Mode

```bash
npm run dev
```

#### Production Mode

```bash
npm run build
npm start
```

The server will start on `http://localhost:4000` (or the port specified in `.env`).

### 7. Start the Expiry Worker (Optional but Recommended)

In a separate terminal, start the worker that expires pending bookings:

```bash
npm run worker
```

## API Documentation

### Swagger UI

Once the server is running, access the Swagger API documentation at:

**http://localhost:4000/api-docs**

### Postman Collection

A Postman collection is included in `postman_collection.json`. Import it into Postman for easy API testing.

## API Endpoints

### Shows

#### Create Show (Admin)
```
POST /api/shows
Content-Type: application/json

{
  "name": "Morning Bus to Mumbai",
  "start_time": "2024-12-25T08:00:00Z",
  "total_seats": 40
}
```

#### List Shows
```
GET /api/shows
```

Returns list of shows with availability counts.

#### Get Show Details
```
GET /api/shows/:id
```

Returns show details with seat-by-seat availability.

### Bookings

#### Create Booking
```
POST /api/bookings
Content-Type: application/json

{
  "user_id": "optional-user-uuid",
  "show_id": "show-uuid",
  "seat_numbers": ["1", "2", "3"]
}
```

Returns booking with `PENDING` status. Seats are held for 2 minutes (configurable).

#### Get Booking
```
GET /api/bookings/:id
```

Returns booking details including status and seats.

#### Confirm Booking
```
POST /api/bookings/:id/confirm
```

Converts a `PENDING` booking to `CONFIRMED` status. Seats are permanently booked.

## Concurrency Control Mechanisms

The system uses multiple strategies to prevent race conditions:

1. **Database Transactions**: All booking operations are wrapped in transactions
2. **Serializable Isolation Level**: Ensures strict consistency
3. **Advisory Locks**: Per-show locks to serialize booking operations
4. **Row-Level Locking**: `FOR UPDATE SKIP LOCKED` prevents lock contention
5. **Optimistic Locking**: Version numbers prevent lost updates
6. **Retry Logic**: Automatic retries on serialization conflicts

## Booking Lifecycle

1. **PENDING**: Booking created, seats held for 2 minutes
2. **CONFIRMED**: User confirms booking, seats permanently booked
3. **FAILED**: Booking expired or seats unavailable

## Testing Concurrency

### Using the Test Script

A Node.js script is provided to test concurrent bookings:

```bash
node test-concurrency.js <show_id> [num_requests] [concurrency]
```

Example:
```bash
node test-concurrency.js abc-123-def-456 100 10
```

This will send 100 concurrent requests (10 at a time) trying to book the same seat, demonstrating that only one booking succeeds.

### Using Postman

Import the `postman_collection.json` file into Postman:
1. Open Postman
2. Click Import
3. Select `postman_collection.json`
4. Set the `base_url` variable to `http://localhost:4000`
5. Use the "Runner" feature to execute multiple requests simultaneously

### Other Tools

- **Apache Bench**: `ab -n 100 -c 10 -p booking.json -T application/json http://localhost:4000/api/bookings`
- **Custom Script**: Use `Promise.all()` to send multiple requests simultaneously

## Project Structure

```
Backend/
├── src/
│   ├── app.ts                 # Express app configuration
│   ├── index.ts               # Server entry point
│   ├── db/
│   │   └── index.ts          # Database connection
│   ├── controllers/          # Request handlers
│   ├── services/             # Business logic
│   ├── routes/               # API routes
│   ├── workers/              # Background workers
│   └── types/                # TypeScript types
├── migrations/               # Database migrations
├── package.json
└── tsconfig.json
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run worker` - Start booking expiry worker
- `npm run migrate` - Run database migrations

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `PORT` | Server port | 4000 |
| `BOOKING_HOLD_SECONDS` | Seconds before PENDING booking expires | 120 |

## Troubleshooting

### Database Connection Issues

- Ensure PostgreSQL is running
- Check `DATABASE_URL` format: `postgresql://user:password@host:port/database`
- Verify database exists

### Port Already in Use

- Change `PORT` in `.env`
- Or kill the process using the port

### Migration Errors

- Ensure database exists
- Check PostgreSQL user permissions
- Verify connection string

## License

This project is created for educational purposes.

## Author

Ticket Booking System - Assignment Submission

