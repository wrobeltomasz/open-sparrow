# this one actually saves space where php:8.2 will take atleast 1gb+ fpm-alpine will take 150mb
# kept it simple my goal was to give a optimized version of image 

FROM php:8.2-fpm-alpine

# apk  Alpine's package manager  much leaner than apt
RUN apk add --no-cache postgresql-dev \
    && docker-php-ext-install pdo pdo_pgsql pgsql \
    && apk del postgresql-dev

COPY docker-php-dev.ini "$PHP_INI_DIR/conf.d/dev.ini"

WORKDIR /var/www/html
COPY --chown=www-data:www-data . .

EXPOSE 9000