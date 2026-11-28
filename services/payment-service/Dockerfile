# Use latest node.js image
FROM node:22-alpine
RUN npm install --global npm@11.21.3

# Create work directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install required dependencies only
RUN npm ci --omit=dev

# Copy application code
COPY src ./src

# Create non-root user
USER node

# Expose port
EXPOSE 5004

# Start the application
CMD [ "node", "src/server.js" ]