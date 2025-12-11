export type SeatStatus = 'AVAILABLE' | 'HELD' | 'BOOKED';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'FAILED';

export interface Seat {
  seat_number: string;
  status: SeatStatus;
}

export interface Show {
  id: string;
  name: string;
  start_time: string;
  total_seats: number;
  available_seats?: number;
  booked_seats?: number;
  held_seats?: number;
  created_at?: string;
  seats?: Seat[];
}

export interface Booking {
  id: string;
  user_id?: string;
  show_id: string;
  status: BookingStatus;
  seats: Seat[];
  created_at: string;
  updated_at: string;
}

export interface CreateShowInput {
  name: string;
  start_time: string;
  total_seats: number;
}

export interface CreateBookingInput {
  show_id: string;
  seat_numbers: string[];
  user_id?: string;
}

export interface ApiError {
  error: string;
}
