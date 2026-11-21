# Use node.js LTS image
FROM node:22-alpine

# Create workdir
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install required depenedencies only
RUN npm ci  --omit=dev

# Copy application code
COPY src ./src

# Create non-root user
USER node

# Expose port
EXPOSE 5003

# Start the application
CMD [ "node", "src/server.js" ]