# Używamy oficjalnego obrazu Pythona 3.14 (wersja slim)
FROM python:3.14-slim

# Ustawienie katalogu roboczego
WORKDIR /app

# Zapobieganie tworzeniu plików .pyc i buforowaniu logów (ważne w Dockerze)
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Instalacja zależności systemowych niezbędnych dla PostgreSQL i narzędzi budowania
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Instalacja Poetry
RUN pip install --no-cache-dir poetry

# Kopiowanie plików konfiguracyjnych Poetry
COPY pyproject.toml poetry.lock* /app/

# Instalacja zależności projektu
# --no-root oznacza, że nie instalujemy jeszcze samego pakietu 'app'
RUN poetry config virtualenvs.create false \
    && poetry install --no-interaction --no-ansi --no-root

# Kopiowanie reszty kodu źródłowego
COPY . /app

# Port, na którym działa FastAPI
EXPOSE 8000

# Komenda startowa
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]