# ---------- Stage 1: dependency PHP (tanpa dev) ----------
FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install \
    --no-dev --no-scripts --no-autoloader \
    --prefer-dist --no-interaction --ignore-platform-reqs

# ---------- Stage 2: build frontend (Vite) ----------
# vendor ikut disalin karena Ziggy kadang di-import dari vendor/ saat build
FROM node:22-alpine AS assets
WORKDIR /app
COPY package*.json .npmrc* ./
RUN npm ci --ignore-scripts || npm install --ignore-scripts
COPY . .
COPY --from=vendor /app/vendor ./vendor
# Fallback: Vite 8 butuh binding native per OS. Kalau package-lock.json dibuat
# di Windows/Mac dan binding Linux-nya nggak ada, install ulang tanpa lockfile.
RUN npm run build \
    || (rm -rf node_modules package-lock.json \
        && npm install --ignore-scripts \
        && npm run build)

# ---------- Stage 3: runtime (nginx + php-fpm) ----------
FROM php:8.3-fpm-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
        nginx unzip libzip-dev libpng-dev libjpeg62-turbo-dev \
        libfreetype6-dev libicu-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" pdo_mysql zip gd bcmath intl opcache \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY docker/php.ini /usr/local/etc/php/conf.d/zz-app.ini
COPY docker/php-fpm.conf /usr/local/etc/php-fpm.d/zz-app.conf
COPY docker/nginx.conf /etc/nginx/nginx.conf.template

RUN useradd -m -u 1000 app
WORKDIR /var/www/html

COPY --chown=app:app . .
COPY --from=vendor --chown=app:app /app/vendor ./vendor
COPY --from=assets --chown=app:app /app/public/build ./public/build

# sed: jaga-jaga kalau start.sh tersimpan dengan line ending Windows (CRLF)
RUN sed -i 's/\r$//' docker/start.sh \
    && mkdir -p storage/framework/cache/data storage/framework/sessions \
        storage/framework/views storage/logs bootstrap/cache \
    && chown -R app:app storage bootstrap/cache

USER app

# --no-scripts: package:discover jalan otomatis saat app pertama boot
RUN composer dump-autoload --no-dev --optimize --no-scripts --no-interaction

ENV PORT=10000
EXPOSE 10000

CMD ["sh", "docker/start.sh"]