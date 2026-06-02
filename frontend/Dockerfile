# Stage 1: Build React Assets
FROM node:22-alpine AS build

WORKDIR /app

# Install dependencies using clean install
COPY package*.json ./
RUN npm ci

# Copy source and build production static bundle
COPY . .
RUN npm run build

# Stage 2: Production Server
FROM nginx:alpine

# Copy compiled static assets to Nginx html directory
COPY --from=build /app/dist /usr/share/nginx/html

# Write a custom Nginx configuration to support SPA routing fallbacks
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
