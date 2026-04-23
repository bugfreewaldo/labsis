# ia-mapper: FastAPI + Anthropic + parsers deterministas.
# Multi-stage distroless keeps the final image lean and minimizes attack surface.
FROM python:3.12-slim AS build
WORKDIR /src
COPY requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir --prefix=/install -r requirements.txt
COPY app ./app

FROM python:3.12-slim AS runtime
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
COPY --from=build /install /usr/local
COPY --from=build /src/app ./app
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
