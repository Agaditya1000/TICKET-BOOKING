# Technical Design Document: Scalable Ticket Booking System

## Executive Summary

This document outlines the technical architecture and scalability considerations for a production-grade ticket booking system similar to RedBus or BookMyShow. The current implementation serves as a foundation that can be scaled to handle millions of concurrent users and bookings.

## Current Architecture

### High-Level System Architecture

```
┌─────────────┐
│   Client    │
│  (Browser/  │
│   Mobile)   │
└──────┬──────┘
       │
       │ HTTP/HTTPS
       │
┌──────▼─────────────────────────────────────┐
│         API Gateway / Load Balancer        │
└──────┬─────────────────────────────────────┘
       │
       ├─────────────────┬─────────────────┐
       │                 │                 │
┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
│   API       │   │   API       │   │   API       │
│  Server 1   │   │  Server 2   │   │  Server N   │
│ (Express)   │   │ (Express)   │   │ (Express)   │
└──────┬──────┘   └──────┬──────┘   └──────┬──────┘
       │                 │                 │
       └─────────────────┼─────────────────┘
                         │
              ┌──────────▼──────────┐
              │   Message Queue     │
              │   (RabbitMQ/Kafka)  │
              └──────────┬──────────┘
                         │
       ┌─────────────────┼─────────────────┐
       │                 │                 │
┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
│  Database   │   │   Cache     │   │   Worker    │
│ PostgreSQL  │   │   Redis     │   │  Processes  │
│ (Primary)   │   │             │   │             │
└──────┬──────┘   └─────────────┘   └─────────────┘
       │
┌──────▼──────┐
│  Database   │
│ PostgreSQL  │
│ (Replicas)  │
└─────────────┘
```

### Key Components

1. **API Servers**: Stateless Express.js servers handling HTTP requests
2. **Database**: PostgreSQL for transactional data with ACID guarantees
3. **Cache Layer**: Redis for frequently accessed data and rate limiting
4. **Message Queue**: For asynchronous processing and decoupling
5. **Worker Processes**: Background jobs for booking expiry, notifications, etc.

## Database Design

### Current Schema

#### Tables
- `shows`: Show/trip/slot information
- `seats`: Individual seat records with status tracking
- `bookings`: Booking records with status
- `booking_seats`: Many-to-many relationship between bookings and seats
- `users`: User information (optional)

#### Key Design Decisions

1. **Normalized Structure**: Separate tables for shows, seats, and bookings
2. **Status Tracking**: Seat status (AVAILABLE, HELD, BOOKED) prevents overbooking
3. **Version Control**: Optimistic locking using version numbers
4. **Time-based Locks**: `locked_until` timestamp for temporary holds

### Scaling Database

#### 1. Read Replicas

```sql
-- Primary database handles writes
-- Multiple read replicas handle queries
-- Load balancer routes read queries to replicas
```

**Benefits:**
- Distribute read load
- Improve query performance
- Geographic distribution

**Implementation:**
- PostgreSQL streaming replication
- Connection pooling with read/write splitting (PgBouncer, PgPool-II)

#### 2. Database Sharding

**Strategy**: Shard by `show_id` or geographic region

```sql
-- Shard 1: Shows with IDs 0-1000
-- Shard 2: Shows with IDs 1001-2000
-- Shard N: Shows with IDs (N-1)*1000+1 to N*1000
```

**Sharding Key Selection:**
- **By Show ID**: Even distribution, but cross-show queries difficult
- **By Geographic Region**: Natural partitioning, but uneven load
- **By Time Range**: Good for historical data, complex for active bookings

**Challenges:**
- Cross-shard queries (e.g., user's all bookings)
- Maintaining referential integrity
- Rebalancing shards

**Solution:**
- Use a sharding middleware (Citus, Vitess)
- Denormalize frequently accessed data
- Use distributed transactions sparingly

#### 3. Partitioning

**Time-based Partitioning:**
```sql
-- Partition bookings table by month
CREATE TABLE bookings_2024_12 PARTITION OF bookings
FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');
```

**Benefits:**
- Faster queries on recent data
- Easier archival of old data
- Improved maintenance

#### 4. Indexing Strategy

**Current Indexes:**
- `idx_seats_show_status`: Fast seat availability queries
- `idx_seats_locked_until`: Efficient expiry worker queries
- `idx_bookings_status`: Quick status-based queries

**Additional Indexes for Scale:**
```sql
-- Composite indexes for common query patterns
CREATE INDEX idx_seats_show_status_locked ON seats(show_id, status, locked_until);
CREATE INDEX idx_bookings_user_show ON bookings(user_id, show_id);
CREATE INDEX idx_bookings_created_status ON bookings(created_at, status);
```

## Concurrency Control Mechanisms

### Current Implementation

1. **Serializable Isolation Level**: Highest consistency, but can cause serialization errors
2. **Advisory Locks**: Per-show locks using `pg_advisory_xact_lock`
3. **Row-Level Locking**: `FOR UPDATE SKIP LOCKED` prevents lock contention
4. **Optimistic Locking**: Version numbers prevent lost updates
5. **Retry Logic**: Exponential backoff on conflicts

### Production Enhancements

#### 1. Pessimistic Locking with Timeout

```sql
-- Lock with timeout to prevent indefinite waits
SELECT * FROM seats 
WHERE show_id = $1 AND seat_number = ANY($2::text[])
FOR UPDATE SKIP LOCKED
LIMIT 1;
```

#### 2. Distributed Locking (Redis)

```javascript
// Use Redis for distributed locks across multiple servers
const lock = await redis.set(
  `lock:show:${showId}`,
  'locked',
  'EX', 5,  // 5 second expiry
  'NX'     // Only set if not exists
);
```

**Benefits:**
- Works across multiple API servers
- Automatic expiry prevents deadlocks
- Lower database load

#### 3. Queue-Based Booking

Instead of direct database writes, use a message queue:

```
User Request → API Server → Message Queue → Booking Worker → Database
```

**Benefits:**
- Decouples API from booking logic
- Natural rate limiting
- Better error handling and retries
- Can process bookings in batches

**Implementation:**
- RabbitMQ or Apache Kafka
- Separate queues per show or priority levels
- Worker pools for processing

#### 4. Event Sourcing (Advanced)

Store all booking attempts as events:

```
BookingRequested → SeatsHeld → BookingConfirmed
                 → SeatsReleased (if expired)
```

**Benefits:**
- Complete audit trail
- Can replay events for debugging
- Enables CQRS pattern

## Caching Strategy

### 1. Show Availability Cache

**Cache Key**: `show:${showId}:availability`

**TTL**: 5-10 seconds (balance between freshness and load)

```javascript
// Pseudo-code
const cacheKey = `show:${showId}:availability`;
let availability = await redis.get(cacheKey);

if (!availability) {
  availability = await db.query(/* get availability */);
  await redis.setex(cacheKey, 10, JSON.stringify(availability));
}
```

**Invalidation:**
- On booking creation/confirmation
- On booking expiry
- Time-based expiry

### 2. Seat Status Cache

**Cache Key**: `show:${showId}:seats`

**Strategy**: Cache only AVAILABLE seats, invalidate on booking

```javascript
// Cache available seat numbers
const availableSeats = await redis.smembers(`show:${showId}:available`);

// On booking, remove from set
await redis.srem(`show:${showId}:available`, ...seatNumbers);
```

### 3. User Session Cache

**Cache Key**: `user:${userId}:bookings`

Cache user's recent bookings to reduce database queries.

### 4. Rate Limiting Cache

**Cache Key**: `ratelimit:${userId}:${endpoint}`

Prevent abuse using Redis with sliding window or token bucket algorithm.

## Message Queue Usage

### Use Cases

1. **Booking Processing**
   - Decouple API from booking logic
   - Handle peak loads gracefully
   - Retry failed bookings

2. **Notifications**
   - Email/SMS confirmations
   - Booking reminders
   - Expiry warnings

3. **Analytics**
   - Track booking patterns
   - Generate reports
   - Real-time dashboards

4. **Inventory Updates**
   - Update search indexes
   - Invalidate caches
   - Sync with external systems

### Queue Architecture

```
┌─────────────┐
│ API Server  │
└──────┬──────┘
       │
       │ Publish
       │
┌──────▼──────────────────────┐
│      Message Queue           │
│  ┌────────────────────────┐  │
│  │  booking-requests      │  │
│  │  (High Priority)       │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │  notifications         │  │
│  │  (Normal Priority)     │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │  analytics             │  │
│  │  (Low Priority)        │  │
│  └────────────────────────┘  │
└──────┬───────────────────────┘
       │
       │ Consume
       │
┌──────▼──────┐
│   Workers   │
└─────────────┘
```

## Scalability Considerations

### Horizontal Scaling

1. **Stateless API Servers**
   - Current implementation is stateless
   - Can scale horizontally behind load balancer
   - Session data in Redis if needed

2. **Database Connection Pooling**
   - Use PgBouncer for connection pooling
   - Limit connections per server
   - Monitor pool utilization

3. **CDN for Static Assets**
   - Serve static files via CDN
   - Reduce server load

### Vertical Scaling

1. **Database Optimization**
   - Tune PostgreSQL configuration
   - Increase shared_buffers, work_mem
   - Use SSD storage

2. **Query Optimization**
   - Analyze slow queries
   - Use EXPLAIN ANALYZE
   - Add appropriate indexes

### Performance Metrics

**Target Metrics:**
- API Response Time: < 200ms (p95)
- Booking Creation: < 500ms (p95)
- Database Query Time: < 50ms (p95)
- Concurrent Users: 10,000+
- Bookings per Second: 1,000+

**Monitoring:**
- Application Performance Monitoring (APM): New Relic, Datadog
- Database Monitoring: pg_stat_statements
- Log Aggregation: ELK Stack, Splunk

## Security Considerations

1. **Authentication & Authorization**
   - JWT tokens for API authentication
   - Role-based access control (Admin vs User)
   - Rate limiting per user/IP

2. **Data Protection**
   - Encrypt sensitive data at rest
   - Use HTTPS for all communications
   - SQL injection prevention (parameterized queries)

3. **DDoS Protection**
   - Rate limiting
   - CAPTCHA for suspicious activity
   - Cloudflare or AWS Shield

## Disaster Recovery

1. **Database Backups**
   - Continuous WAL archiving
   - Daily full backups
   - Point-in-time recovery

2. **Multi-Region Deployment**
   - Active-passive or active-active
   - Database replication across regions
   - DNS-based failover

3. **Monitoring & Alerting**
   - Health checks
   - Automated alerts on failures
   - Runbook for common issues

## Cost Optimization

1. **Resource Right-Sizing**
   - Monitor actual usage
   - Auto-scaling based on load
   - Reserved instances for predictable load

2. **Caching**
   - Reduce database load
   - Lower infrastructure costs

3. **Data Archival**
   - Move old bookings to cold storage (S3, Glacier)
   - Keep only recent data in primary database

## Conclusion

The current implementation provides a solid foundation with proper concurrency control. To scale to production:

1. **Short-term (0-6 months)**
   - Add Redis caching layer
   - Implement read replicas
   - Add comprehensive monitoring

2. **Medium-term (6-12 months)**
   - Introduce message queue for booking processing
   - Implement database sharding
   - Add CDN and optimize static assets

3. **Long-term (12+ months)**
   - Multi-region deployment
   - Advanced analytics and ML for demand prediction
   - Event sourcing for complete auditability

The architecture is designed to evolve incrementally, allowing for continuous improvement while maintaining system stability and performance.

