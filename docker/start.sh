#!/bin/sh
set -e
cd /var/www/html

if [ -z "$APP_KEY" ]; then
    echo "APP_KEY belum di-set. Generate dengan: php artisan key:generate --show"
    exit 1
fi

# nginx jalan sebagai non-root: config final ditulis ke /tmp
mkdir -p /tmp/nginx
sed "s/__PORT__/${PORT:-10000}/" /etc/nginx/nginx.conf.template > /tmp/nginx.conf

php artisan config:cache
php artisan view:cache

# Tunggu DB siap (DB serverless bisa lambat bangun)
tries=0
until php artisan migrate --force; do
    tries=$((tries + 1))
    if [ "$tries" -ge 5 ]; then
        echo "Migrasi gagal 5x. Cek DB_HOST / DB_PORT / kredensial / SSL."
        exit 1
    fi
    echo "DB belum siap, coba lagi dalam 5 detik ($tries/5)..."
    sleep 5
done

php-fpm -F &

exec nginx -e stderr -c /tmp/nginx.conf -g 'daemon off;'