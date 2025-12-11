import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { apiService } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import type { Seat, SeatStatus } from '../types';
import './Booking.css';

export const Booking: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedShow, setSelectedShow, refreshShow } = useApp();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<Set<string>>(new Set());
  const [booking, setBooking] = useState<any>(null);
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'booking' | 'success' | 'error'>(
    'idle'
  );
  const [bookingError, setBookingError] = useState<string | null>(null);
  const seatRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  useEffect(() => {
    const fetchShow = async () => {
      if (!id) {
        setError('Invalid show ID');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const show = await apiService.getShowById(id);
        setSelectedShow(show);
      } catch (err: any) {
        setError(err.message || 'Failed to load show');
      } finally {
        setLoading(false);
      }
    };

    fetchShow();
  }, [id, setSelectedShow]);

  useEffect(() => {
    // Cleanup function to remove highlights when component unmounts
    return () => {
      seatRefs.current.forEach((element) => {
        if (element) {
          element.classList.remove('selected');
        }
      });
    };
  }, []);

  const handleSeatClick = (seatNumber: string, status: SeatStatus) => {
    if (status !== 'AVAILABLE' || bookingStatus === 'booking') {
      return;
    }

    const seatElement = seatRefs.current.get(seatNumber);
    if (!seatElement) return;

    setSelectedSeats((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(seatNumber)) {
        newSet.delete(seatNumber);
        seatElement.classList.remove('selected');
      } else {
        newSet.add(seatNumber);
        seatElement.classList.add('selected');
      }
      return newSet;
    });
  };

  const handleBook = async () => {
    if (!id || selectedSeats.size === 0) {
      setBookingError('Please select at least one seat');
      return;
    }

    setBookingStatus('booking');
    setBookingError(null);

    try {
      const booking = await apiService.createBooking({
        show_id: id,
        seat_numbers: Array.from(selectedSeats),
      });

      setBooking(booking);
      setBookingStatus(booking.status === 'FAILED' ? 'error' : 'success');
      setBookingError(booking.status === 'FAILED' ? 'Booking failed. Some seats may have been taken.' : null);

      // Refresh show data to update seat availability
      if (id) {
        await refreshShow(id);
      }

      // Clear selected seats
      selectedSeats.forEach((seatNumber) => {
        const seatElement = seatRefs.current.get(seatNumber);
        if (seatElement) {
          seatElement.classList.remove('selected');
        }
      });
      setSelectedSeats(new Set());

      // If booking is pending, poll for status updates
      if (booking.status === 'PENDING') {
        pollBookingStatus(booking.id);
      } else if (booking.status === 'CONFIRMED') {
        // Refresh show to update seat availability
        if (id) {
          await refreshShow(id);
        }
      }
    } catch (err: any) {
      setBookingStatus('error');
      setBookingError(err.message || 'Failed to create booking');
    }
  };

  const pollBookingStatus = async (bookingId: string) => {
    const maxAttempts = 20;
    let attempts = 0;

    const interval = setInterval(async () => {
      attempts++;
      try {
        const updatedBooking = await apiService.getBooking(bookingId);
        setBooking(updatedBooking);

        if (updatedBooking.status !== 'PENDING') {
          clearInterval(interval);
          setBookingStatus(updatedBooking.status === 'CONFIRMED' ? 'success' : 'error');
          if (id) {
            await refreshShow(id);
          }
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
        }
      } catch (err) {
        clearInterval(interval);
      }
    }, 2000); // Poll every 2 seconds

    // Cleanup after 40 seconds max
    setTimeout(() => clearInterval(interval), 40000);
  };

  const getSeatStatusClass = (status: SeatStatus): string => {
    switch (status) {
      case 'AVAILABLE':
        return 'available';
      case 'HELD':
        return 'held';
      case 'BOOKED':
        return 'booked';
      default:
        return '';
    }
  };

  const renderSeatGrid = () => {
    if (!selectedShow || !selectedShow.seats) {
      return null;
    }

    const seats = selectedShow.seats;
    const seatsPerRow = Math.ceil(Math.sqrt(selectedShow.total_seats));
    const rows = Math.ceil(seats.length / seatsPerRow);

    return (
      <div className="seat-grid-container">
        <div className="seat-legend">
          <div className="legend-item">
            <div className="legend-color available"></div>
            <span>Available</span>
          </div>
          <div className="legend-item">
            <div className="legend-color held"></div>
            <span>Held</span>
          </div>
          <div className="legend-item">
            <div className="legend-color booked"></div>
            <span>Booked</span>
          </div>
          <div className="legend-item">
            <div className="legend-color selected"></div>
            <span>Selected</span>
          </div>
        </div>
        <div className="seat-grid" style={{ gridTemplateColumns: `repeat(${seatsPerRow}, 1fr)` }}>
          {seats.map((seat: Seat) => (
            <button
              key={seat.seat_number}
              ref={(el) => {
                if (el) {
                  seatRefs.current.set(seat.seat_number, el);
                } else {
                  seatRefs.current.delete(seat.seat_number);
                }
              }}
              className={`seat ${getSeatStatusClass(seat.status)}`}
              onClick={() => handleSeatClick(seat.seat_number, seat.status)}
              disabled={seat.status !== 'AVAILABLE' || bookingStatus === 'booking'}
              title={`Seat ${seat.seat_number} - ${seat.status}`}
            >
              {seat.seat_number}
            </button>
          ))}
        </div>
        <div className="seat-info">
          <p>Selected: {selectedSeats.size} seat(s)</p>
          {selectedSeats.size > 0 && (
            <p className="selected-seats-list">
              {Array.from(selectedSeats).sort((a, b) => parseInt(a) - parseInt(b)).join(', ')}
            </p>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !selectedShow) {
    return (
      <div>
        <ErrorMessage message={error || 'Show not found'} />
        <button className="back-button" onClick={() => navigate('/')}>
          ← Back to Shows
        </button>
      </div>
    );
  }

  return (
    <div className="booking">
      <div className="booking-header">
        <button className="back-button" onClick={() => navigate('/')}>
          ← Back to Shows
        </button>
        <h1>{selectedShow.name}</h1>
        <div className="show-meta">
          <p>
            <strong>Start Time:</strong>{' '}
            {new Date(selectedShow.start_time).toLocaleString()}
          </p>
          <p>
            <strong>Available Seats:</strong>{' '}
            <span className="available-count">{selectedShow.available_seats ?? 0}</span>
          </p>
        </div>
      </div>

      {renderSeatGrid()}

      <div className="booking-actions">
        <button
          className="book-button"
          onClick={handleBook}
          disabled={selectedSeats.size === 0 || bookingStatus === 'booking'}
        >
          {bookingStatus === 'booking'
            ? 'Booking...'
            : selectedSeats.size === 0
            ? 'Select seats to book'
            : `Book ${selectedSeats.size} Seat(s)`}
        </button>
      </div>

      {bookingError && <ErrorMessage message={bookingError} />}

      {booking && (
        <div className={`booking-status ${bookingStatus}`}>
          <h3>Booking Status</h3>
          <div className="status-info">
            <p>
              <strong>Booking ID:</strong> {booking.id.slice(0, 8)}...
            </p>
            <p>
              <strong>Status:</strong>{' '}
              <span className={`status-badge ${booking.status.toLowerCase()}`}>
                {booking.status}
              </span>
            </p>
            {booking.seats && booking.seats.length > 0 && (
              <p>
                <strong>Seats:</strong> {booking.seats.map((s: Seat) => s.seat_number).join(', ')}
              </p>
            )}
            {booking.status === 'PENDING' && (
              <p className="pending-note">
                ⏳ Your booking is pending. It will be confirmed shortly...
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
