FROM python:3.12-slim

WORKDIR /workspace

# Install postgres dynamic client libraries and compiler tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application package
COPY app/ ./app/

EXPOSE 8000

ENV PYTHONUNBUFFERED=1

# Run API with Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
