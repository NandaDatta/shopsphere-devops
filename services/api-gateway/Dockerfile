FROM node:22-alpine
RUN npm install --global npm@11.21.3

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY src ./src

USER node

EXPOSE 5000

CMD ["node", "src/server.js"]