#!/bin/sh
set -e

# Apply database migrations and gather static files before the server starts.
echo "Applying database migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

exec "$@"
