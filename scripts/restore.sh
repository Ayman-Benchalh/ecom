#!/usr/bin/env bash
# ==========================================
# RAYANA — Database Restore Script
# Restores a compressed SQL backup safely
# ==========================================

set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <path_to_backup_file.sql.gz>"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "Error: Backup file not found: ${BACKUP_FILE}"
  exit 1
fi

echo "⚠️  WARNING: Restoring will overwrite existing data in rayana_db."
read -p "Are you sure you want to proceed? (yes/no): " CONFIRM
if [ "${CONFIRM}" != "yes" ]; then
  echo "Aborted."
  exit 0
fi

echo "🔄 Restoring database from ${BACKUP_FILE}..."

if command -v docker >/dev/null 2>&1 && docker ps --filter "name=rayana-db" --format '{{.Names}}' | grep -q "rayana-db"; then
  gunzip -c "${BACKUP_FILE}" | docker exec -i rayana-db psql -U rayana -d rayana_db
elif [ -n "${DATABASE_URL:-}" ]; then
  gunzip -c "${BACKUP_FILE}" | psql "${DATABASE_URL}"
else
  gunzip -c "${BACKUP_FILE}" | psql -h localhost -p 5432 -U rayana -d rayana_db
fi

echo "✓ Database restoration completed successfully!"

