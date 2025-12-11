import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import './Home.css';

export const Home: React.FC = () => {
  const { shows, loading, error, fetchShows } = useApp();

  useEffect(() => {
    fetchShows();
  }, [fetchShows]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={() => fetchShows(true)} />;
  }

  if (shows.length === 0) {
    return (
      <div className="empty-state">
        <p>No shows available at the moment.</p>
        <p className="empty-hint">Check back later or create a show as admin.</p>
      </div>
    );
  }

  return (
    <div className="home">
      <h1>Available Shows & Trips</h1>
      <div className="shows-grid">
        {shows.map((show) => (
          <Link key={show.id} to={`/booking/${show.id}`} className="show-card">
            <div className="show-card-header">
              <h2>{show.name}</h2>
            </div>
            <div className="show-card-body">
              <div className="show-info">
                <span className="info-label">Start Time:</span>
                <span className="info-value">{formatDate(show.start_time)}</span>
              </div>
              <div className="show-info">
                <span className="info-label">Total Seats:</span>
                <span className="info-value">{show.total_seats}</span>
              </div>
              <div className="show-info">
                <span className="info-label">Available:</span>
                <span className="info-value available">
                  {show.available_seats ?? 'N/A'}
                </span>
              </div>
              <div className="show-info">
                <span className="info-label">Booked:</span>
                <span className="info-value booked">
                  {show.booked_seats ?? 'N/A'}
                </span>
              </div>
            </div>
            <div className="show-card-footer">
              <button className="book-button">Book Now →</button>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
