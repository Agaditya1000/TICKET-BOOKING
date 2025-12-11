# Quick Start Guide

## Prerequisites
1. Backend server running on `http://localhost:4000`
2. Node.js v16+ installed

## Setup Steps

1. **Install dependencies:**
   ```bash
   cd Frontend
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open browser:**
   Navigate to `http://localhost:3000`

## Testing the Application

### Admin Flow
1. Click the "⚙️ Admin" button in the header to switch to admin mode
2. Navigate to `/admin` or click "Admin" in the navigation
3. Create a new show:
   - Enter a name (e.g., "Morning Bus to Mumbai")
   - Select a future date/time
   - Enter total seats (e.g., 40)
   - Click "Create Show"
4. View the created show in the list

### User Flow
1. Ensure you're in User mode (click "👤 User" if needed)
2. Browse available shows on the home page
3. Click on a show card to view details
4. Select seats by clicking on them (they'll turn purple)
5. Click "Book X Seat(s)" button
6. Monitor the booking status (PENDING → CONFIRMED/FAILED)

## Features Demonstrated

✅ **Context API**: Global state management for shows and auth
✅ **TypeScript**: Full type safety throughout
✅ **Routing**: `/`, `/admin`, `/booking/:id`
✅ **API Caching**: 30-second cache to prevent unnecessary requests
✅ **Error Handling**: User-friendly error messages with retry
✅ **DOM Manipulation**: Direct seat highlighting via refs
✅ **Loading States**: Spinners during async operations
✅ **Responsive Design**: Works on mobile and desktop

## Troubleshooting

**Frontend won't start:**
- Check Node.js version: `node --version` (should be v16+)
- Delete `node_modules` and run `npm install` again

**API errors:**
- Ensure backend is running on port 4000
- Check browser console for detailed error messages
- Verify CORS is enabled on backend

**Seats not updating:**
- Booking status is polled every 2 seconds for PENDING bookings
- Refresh the page to see latest seat availability

