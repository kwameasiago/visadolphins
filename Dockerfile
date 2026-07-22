FROM php:8.2-apache

# Install MySQL PDO extension
RUN docker-php-ext-install pdo pdo_mysql mysqli

# Enable Apache mod_rewrite and headers
RUN a2enmod rewrite headers

# Copy API source files to Apache document root
COPY api/ /var/www/html/

# Set proper permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html \
    && mkdir -p /var/www/html/uploads/athletes /var/www/html/uploads/equipment /var/www/html/uploads/gallery /var/www/html/uploads/news-events \
    && chmod -R 775 /var/www/html/uploads

# Enable .htaccess support
COPY apache.conf /etc/apache2/sites-enabled/000-default.conf

EXPOSE 80
