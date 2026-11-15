#!/usr/bin/env bash
# ==========================================
# RAYANA — Database Backup Script
# Creates a compressed, timestamped PostgreSQL backup
# ==========================================

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/rayana_backup_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "📦 Creating RAYANA database backup..."

if command -v docker >/dev/null 2>&1 && docker ps --filter "name=rayana-db" --format '{{.Names}}' | grep -q "rayana-db"; then
  docker exec -t rayana-db pg_dump -U rayana -d rayana_db --clean --if-exists | gzip > "${BACKUP_FILE}"
elif [ -n "${DATABASE_URL:-}" ]; then
  pg_dump "${DATABASE_URL}" --clean --if-exists | gzip > "${BACKUP_FILE}"
else
  pg_dump -h localhost -p 5432 -U rayana -d rayana_db --clean --if-exists | gzip > "${BACKUP_FILE}"
fi

echo "✓ Backup successfully created at: ${BACKUP_FILE}"
ls -lh "${BACKUP_FILE}"

