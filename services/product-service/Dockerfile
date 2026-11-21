# Use node.js LTS image
FROM node:22-alpine

# Create work directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install required dependencies only
RUN npm ci --omit=dev

# Copy application code
COPY src ./src

# Create a non-root user
USER node

# Expose the port
EXPOSE 5002

# Start application
CMD [ "node", "src/server.js" ]