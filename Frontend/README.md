# Ticket Booking System - Frontend

A modern React + TypeScript frontend application for the Ticket Booking System. This application provides both Admin and User interfaces for managing and booking tickets for shows, trips, or appointments.

## Features

### Admin Features
- ✅ Create new shows/trips with name, start time, and total seats
- ✅ View list of all shows/trips with availability statistics
- ✅ Form validation and error handling
- ✅ Real-time updates after creating shows

### User Features
- ✅ Browse available shows/trips
- ✅ View detailed seat availability with visual seat grid
- ✅ Select and book multiple seats
- ✅ Real-time booking status updates (PENDING → CONFIRMED/FAILED)
- ✅ Visual feedback for seat selection with DOM manipulation
- ✅ Handle booking conflicts and errors gracefully

### Technical Features
- ✅ React Context API for state management
- ✅ TypeScript for type safety
- ✅ Efficient API calls with caching (30s TTL)
- ✅ React Router for navigation
- ✅ Responsive design for mobile and desktop
- ✅ Loading states and error handling
- ✅ Clean component structure

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router DOM** - Routing
- **Axios** - HTTP client
- **Context API** - State management

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend server running (see Backend README)

## Setup Instructions

### 1. Install Dependencies

```bash
cd Frontend
npm install
```

### 2. Configure API URL

The frontend is configured to connect to `http://localhost:4000` by default. If your backend runs on a different URL, create a `.env` file:

```bash
# .env
VITE_API_URL=http://localhost:4000
```

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### 4. Build for Production

```bash
npm run build
```

The production build will be in the `dist` directory.

### 5. Preview Production Build

```bash
npm run preview
```

## Project Structure

```
Frontend/
├── src/
│   ├── components/          # Reusable components
│   │   ├── Layout.tsx       # Main layout with navigation
│   │   ├── LoadingSpinner.tsx
│   │   └── ErrorMessage.tsx
│   ├── contexts/            # React Context providers
│   │   ├── AuthContext.tsx  # Authentication state
│   │   └── AppContext.tsx   # Global app state
│   ├── pages/               # Page components
│   │   ├── Home.tsx         # User home (shows list)
│   │   ├── Admin.tsx        # Admin dashboard
│   │   └── Booking.tsx      # Booking page with seat selection
│   ├── services/            # API service layer
│   │   └── api.ts           # API client with caching
│   ├── types/               # TypeScript types
│   │   └── index.ts
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Usage

### Switching Between Admin and User Mode

Click the toggle button in the header to switch between Admin and User views:
- **Admin Mode**: Access to `/admin` route for creating and managing shows
- **User Mode**: Access to home page for browsing and booking

### Admin Workflow

1. Click "Admin" in the navigation or toggle to Admin mode
2. Fill in the form to create a new show:
   - **Name**: Show/Bus/Doctor name
   - **Start Time**: Must be in the future
   - **Total Seats**: Between 1 and 200
3. View all created shows in the list on the right

### User Workflow

1. Browse available shows on the home page
2. Click on a show card to view details and book seats
3. Select seats by clicking on them (green = available, yellow = held, red = booked)
4. Click "Book X Seat(s)" to create a booking
5. Monitor booking status (PENDING → CONFIRMED/FAILED)

## API Integration

The frontend integrates with the following backend endpoints:

### Shows
- `GET /api/shows` - List all shows
- `GET /api/shows/:id` - Get show details with seats
- `POST /api/shows` - Create new show (Admin)

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/:id` - Get booking details
- `POST /api/bookings/:id/confirm` - Confirm booking

## Caching Strategy

The API service implements intelligent caching:
- **Show list**: Cached for 30 seconds
- **Show details**: Cached per show ID for 30 seconds
- **Cache invalidation**: Automatically invalidated when:
  - A new show is created
  - A booking is made
  - Manual refresh is triggered

This prevents unnecessary API calls while ensuring data freshness.

## Error Handling

The application handles various error scenarios:
- **Network errors**: Shows user-friendly message with retry option
- **API errors**: Displays error message from backend
- **Form validation**: Real-time validation with error messages
- **Booking conflicts**: Handles concurrent booking attempts gracefully
- **Loading states**: Shows spinners during async operations

## Assumptions

1. **Mock Authentication**: No real authentication system. Admin/User mode is toggled via UI button.
2. **User ID**: Optional for bookings. Can be added later for user-specific features.
3. **Booking Expiry**: Backend handles PENDING booking expiry (2 minutes). Frontend polls for status updates.
4. **Seat Numbers**: Seats are numbered sequentially starting from 1.
5. **Browser Support**: Modern browsers with ES2020 support.

## Known Limitations

1. **No Real Authentication**: Admin/User switching is UI-only. In production, implement proper authentication.
2. **Polling for Status**: Uses polling instead of WebSockets for booking status updates (WebSocket implementation is optional bonus).
3. **No Booking History**: Users cannot view their past bookings (can be added as enhancement).
4. **No Seat Selection Animations**: Basic DOM manipulation for highlighting (animations are optional bonus).
5. **Mobile Optimization**: Responsive but could be further optimized for very small screens.

## Future Enhancements

- [ ] Real authentication system (JWT tokens)
- [ ] WebSocket integration for real-time seat updates
- [ ] Booking history page
- [ ] Seat selection animations
- [ ] Advanced filtering and search
- [ ] User profile management
- [ ] Email notifications for bookings
- [ ] Payment integration

## Development

### Linting

```bash
npm run lint
```

### Type Checking

TypeScript type checking is integrated into the build process. Run:

```bash
npm run build
```

## Screenshots

_Note: Add screenshots or GIFs of the application here after testing._

## License

This project is part of a ticket booking system assignment.
