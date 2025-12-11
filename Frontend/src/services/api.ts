import axios, { AxiosInstance } from 'axios';
import type { Show, Booking, CreateShowInput, CreateBookingInput } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://ticket-booking-nh4s.vercel.app/';

class ApiService {
  private client: AxiosInstance;
  private showCache: Map<string, { data: Show; timestamp: number }> = new Map();
  private showsListCache: { data: Show[]; timestamp: number } | null = null;
  private readonly CACHE_TTL = 30000; // 30 seconds

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          // Server responded with error status
          return Promise.reject({
            message: error.response.data?.error || 'An error occurred',
            status: error.response.status,
          });
        } else if (error.request) {
          // Request made but no response
          return Promise.reject({
            message: 'Network error. Please check your connection.',
            status: 0,
          });
        } else {
          // Something else happened
          return Promise.reject({
            message: error.message || 'An unexpected error occurred',
            status: 0,
          });
        }
      }
    );
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_TTL;
  }

  // Shows API
  async createShow(input: CreateShowInput): Promise<Show> {
    const response = await this.client.post<{ show: Show }>('/api/shows', input);
    // Invalidate cache
    this.showsListCache = null;
    return response.data.show;
  }

  async getShows(forceRefresh = false): Promise<Show[]> {
    // Check cache
    if (!forceRefresh && this.showsListCache && this.isCacheValid(this.showsListCache.timestamp)) {
      return this.showsListCache.data;
    }

    const response = await this.client.get<Show[]>('/api/shows');
    this.showsListCache = {
      data: response.data,
      timestamp: Date.now(),
    };
    return response.data;
  }

  async getShowById(id: string, forceRefresh = false): Promise<Show> {
    // Check cache
    const cached = this.showCache.get(id);
    if (!forceRefresh && cached && this.isCacheValid(cached.timestamp)) {
      return cached.data;
    }

    const response = await this.client.get<Show>(`/api/shows/${id}`);
    this.showCache.set(id, {
      data: response.data,
      timestamp: Date.now(),
    });
    return response.data;
  }

  // Bookings API
  async createBooking(input: CreateBookingInput): Promise<Booking> {
    const response = await this.client.post<Booking>('/api/bookings', input);
    // Invalidate show cache since seats have changed
    this.showCache.delete(input.show_id);
    this.showsListCache = null;
    return response.data;
  }

  async getBooking(id: string): Promise<Booking> {
    const response = await this.client.get<Booking>(`/api/bookings/${id}`);
    return response.data;
  }

  async confirmBooking(id: string): Promise<Booking> {
    const response = await this.client.post<Booking>(`/api/bookings/${id}/confirm`);
    return response.data;
  }

  // Cache management
  invalidateShowCache(showId?: string) {
    if (showId) {
      this.showCache.delete(showId);
    } else {
      this.showCache.clear();
    }
    this.showsListCache = null;
  }
}

export const apiService = new ApiService();
