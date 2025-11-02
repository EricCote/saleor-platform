# Saleor Database Backup Guide

In Saleor platform, you can create a database backup using Docker commands since the database runs in a container. Here are the methods:

## Quick Backup (Docker Compose)

```bash
# Create a backup of the PostgreSQL database
docker compose exec db pg_dump -U SaleorUser saleor > backup_$(date +%Y%m%d_%H%M%S).sql

# Or using docker compose run
docker compose run --rm db pg_dump -h db -U SaleorUser saleor > backup_$(date +%Y%m%d_%H%M%S).sql
```

## Backup with Compression

```bash
# Create compressed backup
docker compose exec db pg_dump -U SaleorUser saleor | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

## Custom Format Backup (Recommended)

```bash
# Create backup in PostgreSQL custom format (smaller, faster restore)
docker compose exec db pg_dump -U SaleorUser -Fc saleor > ./backups/backup_$(date +%Y%m%d_%H%M%S).dump
```

## Restore from Backup

```bash
# Restore from SQL file
docker compose exec -T db psql -U SaleorUser saleor < backup_20241030_143000.sql

# Restore from custom format
docker compose exec db pg_restore -U SaleorUser -d saleor backup_20241030_143000.dump

# Restore with clean (drop existing data first)
docker compose exec db pg_restore -U SaleorUser -d saleor --clean backup_20241030_143000.dump
```

## Full Database Reset with Volume Backup

If you need to backup the entire database volume:

```bash
# Stop services
docker compose stop

# Create volume backup
docker run --rm -v saleor-platform_saleor-db:/data -v $(pwd):/backup ubuntu tar czf /backup/db-volume-backup.tar.gz /data

# Start services
docker compose up -d
```

## Environment-Specific Notes

- Database credentials are defined in `backend.env`
- Default database name: `saleor`
- Default username: `SaleorUser`
- The database container is named `db` in the compose file

The custom format backup (`-Fc`) is recommended for production as it's more efficient and allows selective restoration of tables or schemas.
