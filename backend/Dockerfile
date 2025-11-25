FROM node:24-slim

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        openssl \
        python3 \
        build-essential \
        netcat-traditional \
    && rm -rf /var/lib/apt/lists/* \
    && corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install

COPY . .

RUN chmod +x docker-entrypoint.sh

EXPOSE 3333
EXPOSE 5555

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["pnpm", "start:dev"]