# syntax=docker/dockerfile:1

# ---- Backend (Django 6 + DRF) ----

FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Build deps for Pillow and friends.
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential libjpeg-dev zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
# gunicorn is the production WSGI server; it is not pinned in requirements.txt.
RUN pip install -r requirements.txt gunicorn==23.0.0

COPY . .

# Persisted at runtime via volumes; created here so collectstatic has a target.
RUN mkdir -p staticfiles media

EXPOSE 8000

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
CMD ["gunicorn", "core.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]
