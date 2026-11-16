# BUILD REACT APPLICATION
FROM node:22-alpine AS builder

WORKDIR /app

# Build arguments from Docker Compose
ARG VITE_API_URL=http://localhost:3000
ARG VITE_WS_URL=ws://localhost:3000

ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_WS_URL=${VITE_WS_URL}

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy frontend source
COPY . .

# Build production application
RUN npm run build

# NGINX RUNTIME
FROM nginx:alpine

# Remove default nginx configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy React build output
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]