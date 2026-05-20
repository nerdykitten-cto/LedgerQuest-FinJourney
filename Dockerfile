# Stage 1: Build the Game
FROM node:20-alpine AS game-build
WORKDIR /app/game
COPY GAME/package*.json ./
RUN npm install
COPY GAME/ ./
RUN npm run build

# Stage 2: Build the Main App
FROM node:20-alpine AS app-build
WORKDIR /app/main
COPY APP/package*.json ./
RUN npm install
COPY APP/ ./
# Copy built game into app public folder so it's served at /game/
COPY --from=game-build /app/game/dist/ ./public/game/
RUN npm run build

# Stage 3: Serve with Nginx
FROM nginx:stable-alpine
COPY --from=app-build /app/main/dist /usr/share/nginx/html
# Default Nginx config works for SPAs with a bit of help, but we'll use standard
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
