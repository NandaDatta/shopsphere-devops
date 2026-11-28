# Use Node.js LTS image
FROM node:22-alpine
RUN npm install --global npm@11.21.3

# Set work directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy application source code
COPY src ./src

# Create non-root User
USER node

# Expose application port
EXPOSE 5001

# Start application
CMD [ "node", "src/server.js" ]