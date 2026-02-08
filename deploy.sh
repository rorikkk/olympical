#!/bin/bash
# Deploy script for olympical to TransIP hosting
# Usage: ./deploy.sh
#
# Prerequisites:
#   - SSH key configured for TransIP, or password auth enabled
#   - scp/ssh available on your local machine

HOST="olymqe.ssh.transip.me"
REMOTE_DIR="/www"  # TransIP default web root; adjust if needed
LOCAL_FILE="winterspelen-agenda.html"

echo "=== Deploying to TransIP ($HOST) ==="

# Test SSH connection
echo "[1/3] Testing SSH connection..."
ssh -o ConnectTimeout=10 "$HOST" "echo 'Connection successful'" || {
    echo "ERROR: Cannot connect to $HOST"
    echo "Make sure your SSH key is added or use: ssh-copy-id $HOST"
    exit 1
}

# Upload the file
echo "[2/3] Uploading $LOCAL_FILE..."
scp "$LOCAL_FILE" "$HOST:$REMOTE_DIR/index.html" || {
    echo "ERROR: Upload failed"
    exit 1
}

echo "[3/3] Verifying upload..."
ssh "$HOST" "ls -la $REMOTE_DIR/index.html"

echo ""
echo "=== Deployment complete ==="
echo "Your site should be live on your TransIP domain."
