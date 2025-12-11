import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Show, Booking } from '../types';
import { apiService } from '../services/api';

interface AppContextType {
  shows: Show[];
  loading: boolean;
  error: string | null;
  fetchShows: (forceRefresh?: boolean) => Promise<void>;
  selectedShow: Show | null;
  setSelectedShow: (show: Show | null) => void;
  currentBooking: Booking | null;
  setCurrentBooking: (booking: Booking | null) => void;
  refreshShow: (showId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);

  const fetchShows = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getShows(forceRefresh);
      setShows(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch shows');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshShow = useCallback(async (showId: string) => {
    try {
      const show = await apiService.getShowById(showId, true);
      setSelectedShow(show);
      // Also update in shows list
      setShows((prev) => prev.map((s) => (s.id === showId ? show : s)));
    } catch (err: any) {
      setError(err.message || 'Failed to refresh show');
    }
  }, []);

  return (
    <AppContext.Provider
      value={{
        shows,
        loading,
        error,
        fetchShows,
        selectedShow,
        setSelectedShow,
        currentBooking,
        setCurrentBooking,
        refreshShow,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
