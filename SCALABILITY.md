# Scalability Architecture

## 1. Current Architecture

PrimeTrade is built as a **modular monolith** — a single deployable unit internally organized into clearly bounded modules (`auth`, `tasks`). This is the ideal starting point for a team that needs to move fast without the operational overhead of distributed systems, while keeping the door open for future decomposition.

Each module owns its own controller, service, validation, and route files. The route aggregator at `src/routes/v1/` composes them into a versioned API surface. Adding a new domain (e.g., `orders/`, `notifications/`) is as simple as creating a module directory and registering it in the v1 index.

Because the application holds no session state — all authorization flows through stateless JWT access tokens — **any number of identical instances can run behind a load balancer simultaneously**. There is no sticky-session requirement.

## 2. Database: PostgreSQL + Prisma

**Connection pooling** is handled transparently by Prisma's built-in connection pool. In high-traffic scenarios, replace the default pool with **PgBouncer** in front of PostgreSQL to multiplex thousands of application connections over a small number of real DB connections, dramatically reducing connection overhead.

**Indexing strategy** is applied at the schema level:
- `User.email` — unique index enables O(1) login lookups
- `RefreshToken.userId` + `RefreshToken.token` — covers both the cascade-delete and token-lookup queries
- `Task.userId` + `Task.status` — covers the two most common filter patterns (list own tasks, filter by status)

**Read replicas**: For read-heavy workloads (task listings, stats queries), add a PostgreSQL read replica and route `SELECT` queries through Prisma's `$replica()` client. Writes (create/update/delete) continue to hit the primary.

## 3. Caching with Redis

Three high-value caching targets:

1. **JWT blacklisting**: When a user logs out, add their access token's `jti` to a Redis SET with TTL matching the token's remaining lifetime. The `authenticate` middleware checks this set before accepting a token — preventing token reuse after logout without requiring short-lived tokens on the order of seconds.

2. **Rate limit state**: `express-rate-limit` already supports a Redis store (`rate-limit-redis`). Switching from in-memory to Redis-backed rate limiting makes the limits enforced consistently across all instances, not per-process.

3. **Task list caching**: Frequently-read task lists (especially admin queries over all tasks) can be cached in Redis with a short TTL (30–60 seconds) and invalidated on write. A cache-aside pattern (`GET cache → miss → DB → SET cache`) reduces read latency from ~10ms to sub-millisecond for popular queries.

## 4. Path to Microservices

The modular structure maps cleanly to separate services when traffic justifies it:

- `src/modules/auth/` → **Auth Service** — owns `User` and `RefreshToken` tables, issues and validates tokens
- `src/modules/tasks/` → **Task Service** — owns `Task` table, validates tokens by calling Auth Service or via shared JWT secret

Inter-service communication can start with synchronous HTTP (axios/fetch) and graduate to an event bus (Kafka, RabbitMQ) for eventual-consistency patterns like "send email when task is completed."

The key enabler of safe decomposition is the existing service layer — `auth.service.ts` and `tasks.service.ts` already represent clean boundaries with no cross-module imports.

## 5. Load Balancing

Stateless JWT means any backend instance can serve any request. A standard setup:

```
Internet → NGINX (or AWS ALB) → [Backend instance 1]
                              → [Backend instance 2]
                              → [Backend instance N]
```

**NGINX** handles SSL termination, HTTP/2, and round-robin (or least-connections) routing. **AWS ALB** adds health-check-based routing, auto-registration of new ECS/EC2 instances, and built-in DDoS protection at the edge via AWS Shield.

The only shared state between instances is the database and (optionally) Redis — both of which are already external services.

## 6. Logging and Monitoring

**Winston** is configured with structured JSON output for production. Every log line includes timestamp, level, and message. Add a **correlation ID middleware** (generate a UUID per request, attach to `res.locals`, include in every log call) so you can trace a single request across log lines and across services.

Ship logs to **Datadog**, **CloudWatch**, or **Elasticsearch** via a log forwarder (Fluent Bit, Logstash). Set up alerts on:
- Error rate > 1% of requests
- P99 latency > 500ms
- Database connection pool saturation

## 7. Docker and Kubernetes

The multi-stage Dockerfiles already minimize image size: the production stage contains only the compiled `dist/` output and production `node_modules`, not the TypeScript compiler or dev dependencies.

**Kubernetes path**:
1. Push images to a registry (ECR, GCR, Docker Hub)
2. Write Deployment + Service manifests for backend and frontend
3. Configure **Horizontal Pod Autoscaler** (HPA) targeting CPU utilization at 60% — the HPA will add pods under load and remove them when traffic drops
4. Use a **Kubernetes Secret** for `.env` values rather than baking them into the image
5. Add a **readiness probe** (`GET /health`) so Kubernetes only routes traffic to fully initialized pods

## 8. API Versioning

All routes are registered under `/api/v1/`. This prefix is the contract with clients. Adding a `/api/v2/` surface is a three-step process:

1. Create `src/routes/v2/index.ts` importing new or modified module routers
2. Register `app.use('/api/v2', v2Router)` in `app.ts`
3. Run both versions in parallel until clients migrate — `/v1/` never breaks

This approach supports **gradual migration**: mobile clients pinned to v1 continue working while web clients adopt v2 features. Deprecation is communicated via response headers (`Sunset`, `Deprecation`) and eventually the v1 router is removed once traffic drops to zero.
