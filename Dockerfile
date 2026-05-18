FROM rust:1.88-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY . .

RUN cargo build --release

FROM debian:bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/campus-collab-backend /app/campus-collab-backend
COPY --from=builder /app/migrations /app/migrations

ENV APP_HOST=0.0.0.0
ENV APP_PORT=10000

EXPOSE 10000

CMD ["/app/campus-collab-backend"]