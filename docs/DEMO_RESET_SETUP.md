# Demo Instance Daily Reset - Setup Guide

This guide explains how to set up automated daily resets for the public demo playground instance.

## Why Reset Daily?

Daily resets ensure:
- ✅ **Consistent user experience** - Users always see the same sample data
- ✅ **Clean data** - Prevents accumulation of test queries
- ✅ **Security** - Removes any potentially harmful data
- ✅ **Performance** - Keeps the instance fast and responsive

## Quick Setup

### 1. Generate Reset Secret

Generate a secure random secret for authentication:

```bash
openssl rand -base64 32
```

Add to your `.env` file:

```env
DEMO_RESET_SECRET=<generated-secret>
```

**⚠️ Keep this secret secure!** Anyone with this secret can reset your demo instance.

### 2. Test the Reset Endpoint

Test that the reset works manually:

```bash
curl -X POST http://localhost:3000/api/demo/reset \
  -H "Authorization: Bearer YOUR_DEMO_RESET_SECRET" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "success": true,
  "stats": {
    "deleted": 15,
    "created": 15,
    "duration": 2340
  },
  "timestamp": "2026-02-09T12:00:00.000Z"
}
```

### 3. Set Up Cron Job

#### Option A: System Crontab (Recommended for Production)

Edit your system crontab:

```bash
sudo crontab -e
```

Add this line to run daily at 3 AM:

```cron
0 3 * * * /path/to/picobase/scripts/reset-demo-instance.sh >> /var/log/picobase-demo-reset.log 2>&1
```

**Update the path** to match your actual installation directory.

#### Option B: User Crontab (Development)

Edit your user crontab:

```bash
crontab -e
```

Add:

```cron
0 3 * * * cd /path/to/picobase && ./scripts/reset-demo-instance.sh
```

#### Option C: GitHub Actions (Cloud Deployment)

Create `.github/workflows/reset-demo.yml`:

```yaml
name: Reset Demo Instance

on:
  schedule:
    # Runs daily at 3:00 AM UTC
    - cron: '0 3 * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  reset:
    runs-on: ubuntu-latest
    steps:
      - name: Reset Demo Instance
        run: |
          curl -X POST ${{ secrets.PLATFORM_URL }}/api/demo/reset \
            -H "Authorization: Bearer ${{ secrets.DEMO_RESET_SECRET }}" \
            -H "Content-Type: application/json"
```

Add secrets in GitHub repository settings:
- `PLATFORM_URL`: Your platform URL (e.g., https://picobase.app)
- `DEMO_RESET_SECRET`: Your reset secret

### 4. Verify Cron Setup

Check that your cron job is registered:

```bash
crontab -l
```

You should see your reset job listed.

## Customizing Seed Data

### Option 1: Modify Default Seed Data

Edit `app/api/demo/reset/route.ts` and update the `getDefaultSeedData()` function:

```typescript
function getDefaultSeedData() {
  return {
    posts: [
      {
        title: 'Your Custom Post',
        content: 'Your content here',
        published: true,
        views: 100,
      },
      // ... more posts
    ],
    users: [
      // ... your users
    ],
  }
}
```

### Option 2: Use External Seed File

Create `seed-data.json`:

```json
{
  "posts": [
    {
      "title": "Getting Started",
      "content": "Welcome to PicoBase!",
      "published": true,
      "views": 1000
    }
  ],
  "users": [
    {
      "name": "Demo User",
      "email": "demo@example.com"
    }
  ]
}
```

Modify the reset script to send custom data:

```bash
curl -X POST http://localhost:3000/api/demo/reset \
  -H "Authorization: Bearer $DEMO_RESET_SECRET" \
  -H "Content-Type: application/json" \
  -d @seed-data.json
```

## Monitoring & Alerting

### Check Reset Logs

View recent reset logs:

```bash
tail -n 50 /var/log/picobase-demo-reset.log
```

### Slack Notifications

Add Slack webhook to `.env`:

```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

Uncomment the Slack notification section in `reset-demo-instance.sh`.

### Email Notifications

Install `mailutils`:

```bash
sudo apt-get install mailutils
```

Set admin email:

```env
ADMIN_EMAIL=admin@yourdomain.com
```

Uncomment the email notification section in `reset-demo-instance.sh`.

### Health Check Monitoring

Use a service like [Cronitor](https://cronitor.io) or [Healthchecks.io](https://healthchecks.io):

Add to the end of `reset-demo-instance.sh`:

```bash
# Ping health check service
curl -fsS -m 10 --retry 5 -o /dev/null https://hc-ping.com/YOUR_CHECK_UUID
```

## Troubleshooting

### Reset fails with "Unauthorized"

**Problem:** HTTP 401 error

**Solution:**
1. Check that `DEMO_RESET_SECRET` is set in `.env`
2. Verify the secret matches in both `.env` and cron script
3. Ensure no extra whitespace in the secret

```bash
# Test the secret
echo $DEMO_RESET_SECRET | wc -c  # Should be > 0
```

### Reset succeeds but no data changes

**Problem:** Reset completes but playground shows old data

**Solution:**
1. Check that `DEMO_INSTANCE_ID` matches your actual demo instance
2. Verify the instance is running
3. Check Railway API URL and key are correct

```bash
# Verify instance exists
curl "$RAILWAY_API_URL/instances/$DEMO_INSTANCE_ID/status" \
  -H "X-API-Key: $RAILWAY_API_KEY"
```

### Cron job not running

**Problem:** No logs generated, reset never happens

**Solution:**
1. Check cron service is running:
   ```bash
   sudo service cron status
   ```

2. Verify cron syntax:
   ```bash
   crontab -l
   ```

3. Check script permissions:
   ```bash
   ls -la scripts/reset-demo-instance.sh
   # Should show -rwxr-xr-x (executable)
   ```

4. Test script manually:
   ```bash
   ./scripts/reset-demo-instance.sh
   ```

### Script fails with "command not found"

**Problem:** Cron can't find commands like `curl` or `jq`

**Solution:** Use absolute paths in the script:

```bash
# Find absolute path
which curl  # /usr/bin/curl
which jq    # /usr/bin/jq

# Update script to use absolute paths
/usr/bin/curl -X POST ...
```

## Alternative Reset Schedules

### Multiple resets per day

Reset every 6 hours:
```cron
0 */6 * * * /path/to/reset-demo-instance.sh
```

### Reset during low traffic hours

Reset at 3 AM and 3 PM:
```cron
0 3,15 * * * /path/to/reset-demo-instance.sh
```

### Weekly reset only

Reset every Sunday at midnight:
```cron
0 0 * * 0 /path/to/reset-demo-instance.sh
```

## Best Practices

1. **Log Rotation** - Prevent log files from growing too large:
   ```bash
   # Add to /etc/logrotate.d/picobase-demo
   /var/log/picobase-demo-reset.log {
       daily
       rotate 7
       compress
       missingok
       notifempty
   }
   ```

2. **Backup Before Reset** - Optional backup before reset:
   ```bash
   # Add to reset script before deletion
   curl "$RAILWAY_API_URL/instances/$DEMO_INSTANCE_ID/backup" \
     -H "X-API-Key: $RAILWAY_API_KEY"
   ```

3. **Graceful Degradation** - If reset fails, playground should still work with old data

4. **Monitor Reset Duration** - Alert if reset takes longer than expected (> 10 seconds)

5. **Test in Staging First** - Test reset process in staging before production

## Security Considerations

- ✅ **Secret Rotation** - Rotate `DEMO_RESET_SECRET` periodically
- ✅ **Audit Logging** - Log all reset attempts (successful and failed)
- ✅ **Rate Limiting** - Prevent rapid repeated resets
- ✅ **Access Control** - Only authorized systems should trigger resets

## Manual Reset

To manually reset the demo instance:

```bash
./scripts/reset-demo-instance.sh
```

Or via API:

```bash
curl -X POST https://picobase.app/api/demo/reset \
  -H "Authorization: Bearer $DEMO_RESET_SECRET" \
  -H "Content-Type: application/json"
```

## Production Checklist

Before deploying to production:

- [ ] `DEMO_RESET_SECRET` is set and secure (32+ characters)
- [ ] Cron job is configured and tested
- [ ] Reset script has correct permissions (executable)
- [ ] Logs directory exists and is writable
- [ ] Seed data is appropriate and non-sensitive
- [ ] Monitoring/alerting is configured
- [ ] Email/Slack notifications are set up
- [ ] Reset has been tested manually
- [ ] Cron job has run successfully at least once
- [ ] Log rotation is configured

## Support

If you encounter issues:

1. Check logs: `tail -f /var/log/picobase-demo-reset.log`
2. Test manually: `./scripts/reset-demo-instance.sh`
3. Verify environment variables are set
4. Ensure instance is running and accessible
