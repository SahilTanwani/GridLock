# Use a slim Python 3.11 base image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Prevent Python from writing .pyc files to disk and ensure output is unbuffered
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies required by OpenCV and database drivers
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx \
    libglib2.0-0 \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file to the container
COPY requirements.txt .

# Install Python dependencies securely without caching
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application codebase
COPY . .

# Expose the port Cloud Run uses (defaults to 8080)
EXPOSE 8080

# Run Uvicorn with Gunicorn workers
# We restrict to 1 worker because YOLO inference heavily utilizes multi-threading internally.
# Multiple workers could easily exhaust the memory limits. We boost threads instead.
CMD exec gunicorn app.main:app --bind 0.0.0.0:${PORT:-8080} --worker-class uvicorn.workers.UvicornWorker --workers 1 --threads 8 --timeout 0
