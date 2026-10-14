# Satu stage saja: free tier SnapDeploy (Small) membatasi maksimal 2 build stage.
# Aset frontend TIDAK di-build di sini. public/build dibuild lokal (npm run build)
# lalu di-commit (git add -f public/build).
FROM php:8.3-fpm-bookworm

ENV COMPOSER_ALLOW_SUPERUSER=1

# -j1: compile ekstensi satu per satu supaya hemat RAM
RUN apt-get update && apt-get install -y --no-install-recommends \
        nginx unzip libzip-dev libpng-dev libjpeg62-turbo-dev \
        libfreetype6-dev libicu-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j1 pdo_mysql zip gd bcmath intl opcache \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY docker/php.ini /usr/local/etc/php/conf.d/zz-app.ini
COPY docker/php-fpm.conf /usr/local/etc/php-fpm.d/zz-app.conf
COPY docker/nginx.conf /etc/nginx/nginx.conf.template

RUN useradd -m -u 1000 app
WORKDIR /var/www/html

# Dependency PHP dipasang dulu supaya layer-nya bisa di-cache
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader \
    --prefer-dist --no-interaction

COPY . .

# Gagal cepat kalau aset frontend belum ikut ter-commit
RUN test -f public/build/manifest.json \
    || (echo "public/build belum ada. Jalankan: npm run build, lalu: git add -f public/build" && exit 1)

# sed: jaga-jaga kalau start.sh tersimpan dengan line ending Windows (CRLF)
RUN sed -i 's/\r$//' docker/start.sh \
    && mkdir -p storage/framework/cache/data storage/framework/sessions \
        storage/framework/views storage/logs bootstrap/cache \
    && chown -R app:app /var/www/html

USER app

# --no-scripts: package:discover jalan otomatis saat app pertama boot
RUN composer dump-autoload --no-dev --optimize --no-scripts --no-interaction

ENV PORT=10000
EXPOSE 10000

CMD ["sh", "docker/start.sh"]