FROM node:18
WORKDIR /app

COPY backend/package*.json ./
RUN npm install

COPY backend/. .

EXPOSE 5000
EXPOSE 4000

CMD ["node", "Server.js"]
