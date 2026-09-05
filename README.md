# Distributed URL Shortener

A high-performance, distributed URL shortening service built with TypeScript, Express.js, PostgreSQL, Redis, and Kafka.

## 🎯 Features

- **URL Shortening**: Generate unique, collision-resistant short codes using Snowflake algorithm
- **Distributed Architecture**: Worker registry with automatic load distribution (0-1023 workers)
- **Caching Layer**: Redis-backed caching with 1-hour TTL and 750ms timeout protection
- **Event Streaming**: Kafka-based event publishing for analytics and monitoring
- **Analytics**: Real-time redirect tracking with User-Agent and Referer breakdown
- **Metrics**: Prometheus-compatible metrics endpoint for observability
- **Health Checks**: Dependency health monitoring (PostgreSQL, Redis)
- **Graceful Shutdown**: Clean resource cleanup on server termination

## 🏗️ Architecture

### Services

```
┌─────────────────────────────────────────────────────────────┐
│                    URL Shortener API                         │
│                    (Express.js Server)                       │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
   PostgreSQL            Redis Cache         Kafka Broker
   (Persistence)         (Hot Cache)         (Event Stream)
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
                        Kafka Consumer
                      (Analytics Worker)
```

### Data Flow

**URL Creation:**
```
POST /api/v1/urls → Validate → Generate Snowflake ID → Encode Base62 
→ Insert to PostgreSQL (3x retry on collision) → Return 201
```

**URL Redirect:**
```
GET /:shortCode → Check Redis Cache → Check PostgreSQL → Publish Kafka Event 
→ Return 302 Redirect
```

**Analytics:**
```
Kafka Event → Consumer → Parse & Validate → Persist to DB 
→ GET /api/v1/urls/:shortCode/stats aggregates data
```

## 📋 Prerequisites

- **Bun**: v1.3.10+ 
- **PostgreSQL**: 14+ (with Docker Compose setup included)
- **Redis**: 7+ (with Docker Compose setup included)
- **Kafka**: 3.2+ (with Docker Compose setup included)

## ⚙️ Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Distributed-urlShortener
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Set Up Environment Variables

Create a `.env` file in the project root:

```bash
# Server
PORT=3000

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/url_shortener

# Redis
REDIS_URL=redis://localhost:6379

# Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=url-shortener-api
KAFKA_REDIRECT_TOPIC=redirect-events
KAFKA_CONSUMER_GROUP_ID=url-shortener-analytics
```

### 4. Start Services with Docker Compose

```bash
docker-compose up -d
```

This starts:
- **PostgreSQL** on port 5432
- **Redis** on port 6379
- **Kafka** on port 9092
- **Nginx** reverse proxy on port 80

### 5. Initialize Database

```bash
# Run Prisma migrations
bunx prisma migrate deploy

# (Optional) Open Prisma Studio
bunx prisma studio
```

## 🚀 Running the Service

### Development Mode (with auto-reload)

```bash
# Start the API server
bun run dev

# In another terminal, start the analytics consumer
bun run dev:consumer
```

### Production Mode

```bash
# Start the API server
bun run start

# In another terminal, start the analytics consumer
bun run start:consumer
```

### Load Testing

```bash
# Run k6 in Docker (works on Windows without installing k6 locally)
# Replace the short code with one returned by POST /api/v1/urls.
powershell -ExecutionPolicy Bypass -File .\load-tests\run.ps1 `
  -ShortCode GO779mWC2q `
  -Rate 50 `
  -Vus 10 `
  -Duration 30s
```

## 📡 API Endpoints

### Health Check

```bash
GET /health

Response (200 OK):
{
  "status": "ok",
  "service": "url-shortener",
  "dependencies": {
    "database": "ok",
    "cache": "ok"
  }
}
```

### Create Short URL

```bash
POST /api/v1/urls

Request:
{
  "longUrl": "https://example.com/very/long/path",
  "expiresAt": "2025-12-31T23:59:59Z"  // Optional
}

Response (201 Created):
{
  "shortCode": "a3K9p2X",
  "shortUrl": "http://localhost:3000/a3K9p2X",
  "longUrl": "https://example.com/very/long/path",
  "expiresAt": "2025-12-31T23:59:59.000Z"
}
```

### Redirect to Long URL

```bash
GET /:shortCode

Response (302 Found):
Location: https://example.com/very/long/path
X-Request-ID: <uuid>
X-Worker-ID: <worker-id>
```

### Get Redirect Statistics

```bash
GET /api/v1/urls/:shortCode/stats

Response (200 OK):
{
  "shortCode": "a3K9p2X",
  "totalClicks": 156,
  "lastClickedAt": "2026-09-05T14:30:22.000Z",
  "clicksByUserAgent": [
    {
      "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "clicks": 98
    },
    {
      "userAgent": "curl/7.64.1",
      "clicks": 58
    }
  ],
  "clicksByReferer": [
    {
      "referer": "https://twitter.com",
      "clicks": 120
    },
    {
      "referer": "https://reddit.com",
      "clicks": 36
    }
  ]
}
```

### Metrics Endpoint

```bash
GET /metrics

Response (200 OK - Prometheus format):
# TYPE http_requests_total counter
http_requests_total 1250
# TYPE successful_redirects_total counter
successful_redirects_total 1200
# TYPE http_404_total counter
http_404_total 10
# TYPE url_creations_total counter
url_creations_total 45
# TYPE redis_cache_hits_total counter
redis_cache_hits_total 980
# TYPE redis_cache_misses_total counter
redis_cache_misses_total 220
```

## 📊 Database Schema

### Url Table

```sql
CREATE TABLE url (
  id BIGINT PRIMARY KEY DEFAULT autoincrement(),
  shortCode VARCHAR(20) UNIQUE NOT NULL,
  longUrl TEXT NOT NULL,
  createdAt TIMESTAMP DEFAULT now(),
  expiresAt TIMESTAMP,
  
  INDEX(shortCode)
);
```

### RedirectEvent Table

```sql
CREATE TABLE redirect_events (
  id BIGINT PRIMARY KEY DEFAULT autoincrement(),
  eventId VARCHAR(36) UNIQUE NOT NULL,
  eventType VARCHAR(50) NOT NULL,
  urlId BIGINT NOT NULL,
  shortCode VARCHAR(20) NOT NULL,
  userAgent TEXT,
  referer TEXT,
  occurredAt TIMESTAMP NOT NULL,
  createdAt TIMESTAMP DEFAULT now(),
  
  INDEX(urlId),
  INDEX(shortCode),
  INDEX(occurredAt)
);
```

## 📈 Observability & Monitoring

### Metrics Collection

The service collects comprehensive metrics:

**Counters:**
- `http_requests_total` - Total HTTP requests
- `successful_redirects_total` - 302 redirects
- `http_404_total` - Not found errors
- `url_creations_total` - Created short URLs
- `redis_cache_hits_total` - Cache hits
- `redis_cache_misses_total` - Cache misses
- `kafka_publish_failures_total` - Event publishing failures
- `consumer_processing_failures_total` - Consumer errors

**Histograms:**
- `database_query_duration_ms` - Database query latency
- `http_request_duration_ms` - HTTP request latency

### Request Tracking

Every request includes:
- `X-Request-ID`: Unique request identifier (UUID)
- `X-Worker-ID`: Worker instance that handled the request

### Logging

All requests are logged with structured JSON:

```json
{
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "workerId": "5",
  "method": "GET",
  "path": "/a3K9p2X",
  "statusCode": 302,
  "durationMs": 12.345
}
```

## 🔄 Worker Registry

The service uses a distributed worker registry to manage multiple instances:

- **Worker IDs**: 0-1023 (1024 possible workers)
- **Registration**: Atomic registration via Redis with NX flag
- **Lease TTL**: 30 seconds
- **Renewal**: Every 10 seconds
- **Automatic Release**: On graceful shutdown

This allows multiple instances to run concurrently with automatic load distribution.

## 🔒 Resilience Patterns

### Cache Timeout Protection
- Redis cache operations have 750ms timeout
- Falls back to PostgreSQL on timeout

### Kafka Publishing Resilience
- Up to 3 retry attempts with exponential backoff (500ms, 1s, 1.5s)
- Auto-reconnect on failure
- Non-blocking (doesn't block HTTP response)

### Database Collision Handling
- 3 retry attempts on unique constraint violation
- Automatically regenerates short code on collision

### Graceful Degradation
- Kafka is optional (service works without it)
- Errors logged but don't block operations
- All external service failures are handled gracefully

## 🧪 Testing

```bash
# Run unit tests
bun test

# Run load tests through Docker k6
powershell -ExecutionPolicy Bypass -File .\load-tests\run.ps1 -ShortCode GO779mWC2q
```

## 🛠️ Project Structure

```
src/
├── app.ts                          # Express app setup
├── server.ts                       # Server initialization
├── config/
│   ├── database.ts                 # Prisma client
│   ├── redis.ts                    # Redis client
│   ├── env.ts                      # Environment config
│   └── error.ts                    # Error types & handlers
├── core/
│   ├── id-generator.ts             # Snowflake algorithm
│   ├── base62.ts                   # Base62 encoding
│   └── worker-registry.ts          # Worker registration
├── modules/url/
│   ├── url.controller.ts           # HTTP handlers
│   ├── url.service.ts              # Business logic
│   ├── url.repository.ts           # Database access
│   ├── url.cache.ts                # Redis caching
│   ├── url-code.generator.ts       # ID generation
│   ├── url.routes.ts               # Express routes
│   ├── url.types.ts                # Type definitions
│   ├── url.validation.ts           # Input validation
│   ├── url.cache.interface.ts      # Cache interface
│   ├── url.repository.interface.ts # Repository interface
│   └── url-code.generator.interface.ts # Generator interface
├── kafka/
│   ├── kafka.client.ts             # Kafka client setup
│   ├── kafka.producer.ts           # Event publishing
│   ├── kafka.consumer.ts           # Event consumption
│   ├── kafka.types.ts              # Event types
│   └── consumer.server.ts          # Consumer service
├── middleware/
│   └── error.middleware.ts         # Error handler
├── routes/
│   └── heaalth.routes.ts           # Health check endpoint
└── observability/
    └── metrics.ts                  # Prometheus metrics

prisma/
├── schema.prisma                   # Database schema
└── migrations/                     # Database migrations

tests/
└── url.service.test.ts             # Service tests

docker-compose.yml                  # Docker services
Dockerfile                          # Container image
nginx/nginx.conf                    # Reverse proxy config
```

## 🚀 Performance Characteristics

- **ID Generation**: O(1) - Single Snowflake algorithm
- **URL Creation**: O(log n) - Database insert + retry logic (avg 1 attempt)
- **URL Lookup**: O(1) - Redis cache or indexed database query
- **Statistics**: O(n) - Aggregation queries with proper indices

### Throughput

Expected performance with proper tuning:
- **URLs Created/sec**: 1000+ (PostgreSQL dependent)
- **Redirects/sec**: 5000+ (Redis cached)
- **Cache Hit Ratio**: 95%+ (with 1-hour TTL)

## 📝 Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | API server port |
| `DATABASE_URL` | - | PostgreSQL connection string (required) |
| `REDIS_URL` | redis://localhost:6379 | Redis connection string |
| `KAFKA_BROKERS` | localhost:9092 | Comma-separated Kafka brokers |
| `KAFKA_CLIENT_ID` | url-shortener-api | Kafka client identifier |
| `KAFKA_REDIRECT_TOPIC` | redirect-events | Kafka topic for redirect events |
| `KAFKA_CONSUMER_GROUP_ID` | url-shortener-analytics | Kafka consumer group |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


## 🙋 Support

For issues, questions, or suggestions, please open an issue on GitHub.
