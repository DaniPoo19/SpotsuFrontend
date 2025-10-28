# Build Stage
FROM node:18-slim AS build

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Limpiar cache de npm y reinstalar dependencias desde cero
# Esto resuelve el bug de npm con dependencias opcionales de Rollup
RUN rm -rf node_modules package-lock.json || true && \
    npm cache clean --force && \
    npm install

# Copy the rest of your application files
COPY . .

# Build arguments for environment variables
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build the application for production
RUN npm run build

# Production Stage
FROM nginx:stable-alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose the port nginx runs on
EXPOSE 80

# Define the command to run nginx
CMD ["nginx", "-g", "daemon off;"]