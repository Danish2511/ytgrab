FROM node:20-slim AS base

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev=false

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["npm", "start"]
