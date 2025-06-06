FROM alpine:latest AS optimizer

RUN apk add --no-cache gzip brotli

WORKDIR /opt/app

# Copy built files from your local machine (dist) into image
COPY dist/ .

# Precompress assets (gzip and brotli)
RUN find . -type f \( -name '*.js' -o -name '*.css' -o -name '*.html' -o -name '*.svg' -o -name '*.json' \) \
    -exec gzip -9 -k {} \; \
    -exec brotli -q 11 -o {}.br {} \;

# --- Final Nginx Stage ---
FROM nginx:1.28-alpine

# Clean default nginx assets and config
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/default.conf

# Copy optimized, compressed frontend files
COPY --from=optimizer /opt/app /usr/share/nginx/html

# Copy your custom nginx config (supports precompressed assets, SPA, etc.)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# (Optional) Set permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    mkdir -p /var/cache/nginx/client_temp && \
    chown -R nginx:nginx /var/cache/nginx

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
