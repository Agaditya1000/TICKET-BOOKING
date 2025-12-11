import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { apiService } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import type { CreateShowInput } from '../types';
import './Admin.css';

export const Admin: React.FC = () => {
  const { shows, loading, error, fetchShows } = useApp();
  const [formData, setFormData] = useState<CreateShowInput>({
    name: '',
    start_time: '',
    total_seats: 40,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    fetchShows();
  }, [fetchShows]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.start_time) {
      errors.start_time = 'Start time is required';
    } else {
      const selectedDate = new Date(formData.start_time);
      const now = new Date();
      if (selectedDate <= now) {
        errors.start_time = 'Start time must be in the future';
      }
    }

    if (!formData.total_seats || formData.total_seats < 1) {
      errors.total_seats = 'Total seats must be at least 1';
    } else if (formData.total_seats > 200) {
      errors.total_seats = 'Total seats cannot exceed 200';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      await apiService.createShow(formData);
      setSubmitSuccess(true);
      setFormData({
        name: '',
        start_time: '',
        total_seats: 40,
      });
      await fetchShows(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to create show');
    } finally {
      setSubmitting(false);
    }
  };

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

  // Get current date-time in local timezone for min attribute
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1); // At least 1 minute in the future
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="admin">
      <h1>Admin Dashboard</h1>

      <div className="admin-content">
        <section className="create-show-section">
          <h2>Create New Show/Trip</h2>
          <form onSubmit={handleSubmit} className="create-show-form">
            <div className="form-group">
              <label htmlFor="name">Show/Bus/Doctor Name *</label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={formErrors.name ? 'error' : ''}
                placeholder="e.g., Morning Bus to Mumbai"
              />
              {formErrors.name && <span className="error-message">{formErrors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="start_time">Start Time *</label>
              <input
                type="datetime-local"
                id="start_time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                min={getMinDateTime()}
                className={formErrors.start_time ? 'error' : ''}
              />
              {formErrors.start_time && (
                <span className="error-message">{formErrors.start_time}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="total_seats">Total Seats *</label>
              <input
                type="number"
                id="total_seats"
                value={formData.total_seats}
                onChange={(e) =>
                  setFormData({ ...formData, total_seats: parseInt(e.target.value) || 0 })
                }
                min="1"
                max="200"
                className={formErrors.total_seats ? 'error' : ''}
              />
              {formErrors.total_seats && (
                <span className="error-message">{formErrors.total_seats}</span>
              )}
            </div>

            {submitError && <ErrorMessage message={submitError} />}
            {submitSuccess && (
              <div className="success-message">✅ Show created successfully!</div>
            )}

            <button type="submit" disabled={submitting} className="submit-button">
              {submitting ? 'Creating...' : 'Create Show'}
            </button>
          </form>
        </section>

        <section className="shows-list-section">
          <h2>All Shows/Trips</h2>
          {loading ? (
            <LoadingSpinner />
          ) : error ? (
            <ErrorMessage message={error} onRetry={() => fetchShows(true)} />
          ) : shows.length === 0 ? (
            <div className="empty-state">No shows created yet.</div>
          ) : (
            <div className="admin-shows-list">
              {shows.map((show) => (
                <div key={show.id} className="admin-show-card">
                  <div className="admin-show-header">
                    <h3>{show.name}</h3>
                    <span className="show-id">ID: {show.id.slice(0, 8)}...</span>
                  </div>
                  <div className="admin-show-details">
                    <div className="detail-item">
                      <span className="detail-label">Start Time:</span>
                      <span className="detail-value">{formatDate(show.start_time)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Total Seats:</span>
                      <span className="detail-value">{show.total_seats}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Available:</span>
                      <span className="detail-value available">{show.available_seats ?? 0}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Booked:</span>
                      <span className="detail-value booked">{show.booked_seats ?? 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
