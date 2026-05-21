# Stage 1: Build the App
FROM node:20-alpine AS build
WORKDIR /app
COPY APP/package*.json ./
RUN npm install
COPY APP/ ./
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:stable-alpine

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx template
COPY nginx.conf.template /etc/nginx/conf.d/default.conf.template

# Cloud Run uses the PORT environment variable. 
# We use envsubst to replace ${PORT} in the template at runtime.
CMD ["sh", "-c", "envsubst '${PORT}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && exec nginx -g 'daemon off;'"]
