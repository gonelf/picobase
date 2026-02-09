#!/bin/bash

# Demo Instance Daily Reset Script
# This script resets the demo playground instance to fresh seed data
# Run daily via cron: 0 3 * * * /path/to/reset-demo-instance.sh

set -e  # Exit on error

# Load environment variables from .env file if it exists
if [ -f "$(dirname "$0")/../.env" ]; then
    export $(cat "$(dirname "$0")/../.env" | grep -v '^#' | xargs)
fi

# Configuration
PLATFORM_URL="${PLATFORM_URL:-http://localhost:3000}"
DEMO_RESET_SECRET="${DEMO_RESET_SECRET}"
LOG_FILE="${LOG_FILE:-/var/log/picobase-demo-reset.log}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Check if DEMO_RESET_SECRET is set
if [ -z "$DEMO_RESET_SECRET" ]; then
    log_error "DEMO_RESET_SECRET environment variable is not set"
    exit 1
fi

log "Starting demo instance reset..."

# Call the reset API endpoint
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    "${PLATFORM_URL}/api/demo/reset" \
    -H "Authorization: Bearer ${DEMO_RESET_SECRET}" \
    -H "Content-Type: application/json")

# Extract HTTP status code (last line)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

# Extract response body (all lines except last)
BODY=$(echo "$RESPONSE" | head -n-1)

# Check response
if [ "$HTTP_CODE" -eq 200 ]; then
    log_success "Demo instance reset successful"

    # Parse and log stats if available
    if command -v jq &> /dev/null; then
        DELETED=$(echo "$BODY" | jq -r '.stats.deleted // "N/A"')
        CREATED=$(echo "$BODY" | jq -r '.stats.created // "N/A"')
        DURATION=$(echo "$BODY" | jq -r '.stats.duration // "N/A"')

        log "  Deleted: $DELETED records"
        log "  Created: $CREATED records"
        log "  Duration: ${DURATION}ms"
    else
        log "  Response: $BODY"
    fi
else
    log_error "Demo instance reset failed (HTTP $HTTP_CODE)"
    log_error "Response: $BODY"
    exit 1
fi

log "Demo instance reset completed"

# Optional: Send notification (uncomment and configure as needed)
# Example: Send to Slack
# if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
#     curl -s -X POST "$SLACK_WEBHOOK_URL" \
#         -H "Content-Type: application/json" \
#         -d "{\"text\": \"Demo instance reset completed: $DELETED deleted, $CREATED created\"}"
# fi

# Example: Send email
# if [ ! -z "$ADMIN_EMAIL" ]; then
#     echo "Demo instance reset completed at $(date)" | mail -s "PicoBase Demo Reset" "$ADMIN_EMAIL"
# fi

exit 0
