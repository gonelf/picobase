# Public API Playground - Security & Setup Guide

The public API playground allows users to test PicoBase's API without creating an account. This document explains the security measures in place and how to set up the demo instance.

## Security Features

### 1. **Read-Only Access**
- Only `getList` and `getOne` operations are allowed
- All write operations (create, update, delete) are blocked
- Users cannot modify demo data

### 2. **Rate Limiting**
- **30 requests per minute** per IP address
- Prevents abuse and ensures fair usage
- In-memory rate limiting (upgrade to Redis for production)

### 3. **Referrer Validation**
- API requests must originate from `picobase.com` domain
- Prevents unauthorized external usage
- Blocks attempts to use demo API in other projects

### 4. **Response Limits**
- Maximum 50 records per page (hardcoded in demo API)
- Prevents expensive queries

### 5. **Isolated Demo Instance**
- Dedicated instance separate from production data
- Cannot access user instances or sensitive data
- Sandboxed environment

## Setup Instructions

### Step 1: Create Demo Instance

1. Create a new PicoBase instance specifically for demo purposes:
   ```bash
   # Create instance via dashboard or CLI
   picobase create demo-playground
   ```

2. Populate with sample data:
   ```typescript
   // Example collections to create:
   - posts (title, content, published, views, author)
   - users (name, email, avatar)
   - comments (post, author, content)
   ```

### Step 2: Configure Environment

Add the demo instance ID to your `.env` file:

```env
DEMO_INSTANCE_ID=your-demo-instance-id
```

### Step 3: Set Up Auto-Reset (Recommended)

To maintain data integrity, set up a cron job to reset demo data periodically:

```bash
# Reset demo instance every 6 hours
0 */6 * * * /path/to/reset-demo-instance.sh
```

Example reset script:

```bash
#!/bin/bash
# reset-demo-instance.sh

INSTANCE_ID="your-demo-instance-id"
API_URL="https://your-api.railway.app"
API_KEY="your-api-key"

# Delete all records
curl -X DELETE "$API_URL/instances/$INSTANCE_ID/reset" \
  -H "X-API-Key: $API_KEY"

# Re-seed with fresh data
curl -X POST "$API_URL/instances/$INSTANCE_ID/seed" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d @demo-seed-data.json
```

## Security Checklist

Before deploying the public playground to production:

- [ ] Demo instance ID is set in environment variables
- [ ] Demo instance uses separate database (not production)
- [ ] Rate limiting is configured appropriately
- [ ] Referrer validation is enabled (production mode)
- [ ] Auto-reset cron job is set up
- [ ] Demo data contains no sensitive information
- [ ] Write operations are confirmed blocked
- [ ] Response size limits are enforced
- [ ] Monitoring/alerting is configured for abuse detection

## API Endpoints

### Get Demo Collections
```
GET /api/demo/collections
```
Returns list of available collections in demo instance.

**Security:**
- Rate limited: 30 req/min per IP
- Referrer validation required

### Execute Demo Query
```
POST /api/demo/playground
```
Executes a read-only query against demo data.

**Request Body:**
```json
{
  "method": "getList",
  "collection": "posts",
  "params": {
    "page": 1,
    "perPage": 10,
    "filter": "published = true",
    "sort": "-created"
  }
}
```

**Security:**
- Rate limited: 30 req/min per IP
- Referrer validation required
- Only read operations allowed
- Method whitelist: getList, getOne

## Monitoring

Monitor these metrics to detect abuse:

1. **Rate Limit Hits**
   - Track IPs hitting rate limits
   - Alert on suspicious patterns

2. **Failed Referrer Checks**
   - Log blocked requests
   - Investigate repeated offenders

3. **Query Patterns**
   - Monitor for expensive queries
   - Track unusual filter combinations

4. **Traffic Volume**
   - Set up alerts for traffic spikes
   - Implement auto-scaling if needed

## Upgrading Rate Limiting

For production deployments with multiple servers, replace in-memory rate limiting with Redis:

```typescript
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

export async function checkRateLimit(ip: string): Promise<boolean> {
  const key = `ratelimit:${ip}`
  const current = await redis.incr(key)

  if (current === 1) {
    await redis.expire(key, 60) // 60 second window
  }

  return current <= 30 // 30 requests per minute
}
```

## Sample Data Recommendations

Good demo data should be:

1. **Realistic but Generic**
   - Use placeholder content
   - Avoid real names, emails, or sensitive data

2. **Varied**
   - Different data types and structures
   - Examples of relations and nested data

3. **Well-Documented**
   - Comments explaining data structure
   - README describing collections

Example collections:

```
posts:
  - 20-30 blog posts
  - Mix of published/draft
  - Various view counts
  - Different authors

users:
  - 5-10 sample users
  - Generic names (User 1, User 2)
  - Placeholder avatars

comments:
  - 50-100 comments
  - Linked to posts via relations
  - Shows nested data examples
```

## Troubleshooting

### Users can't access playground
- Check DEMO_INSTANCE_ID is set
- Verify demo instance is running
- Check Railway API URL/Key configuration

### Rate limit too restrictive
- Adjust MAX_REQUESTS_PER_WINDOW in `lib/demo-security.ts`
- Consider per-session limits instead of per-IP

### Demo data gets corrupted
- Set up auto-reset cron job
- Implement admin endpoint for manual reset
- Monitor for suspicious activity

## Future Enhancements

Potential improvements:

1. **Per-session rate limiting** - More accurate than IP-based
2. **CAPTCHA integration** - Additional bot protection
3. **Analytics dashboard** - Track playground usage
4. **Interactive tutorials** - Guided playground experience
5. **Code generation** - Multiple language examples
