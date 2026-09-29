FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev

COPY src ./src
COPY src/Utils/seedData.js ./src/Utils/seedData.js

RUN mkdir -p /app/uploads /app/logs

ENV NODE_ENV=production

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r)=>{process.exit(r.statusCode===200?0:1)})"

CMD ["node", "src/server.js"]
