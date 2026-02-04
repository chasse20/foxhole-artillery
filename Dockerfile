# Frontend
FROM node:22-alpine AS build
WORKDIR /app

COPY client/package.json client/package-lock.json ./
RUN npm install --force
COPY client/ ./
RUN npm run build

FROM node:22-alpine
WORKDIR /app

# Env
ENV NODE_ENV=production
ENV PORT=8080

# Server
COPY server/ .
COPY --from=build /app/dist ./dist
RUN npm install --omit=dev

EXPOSE 8080
CMD ["node", "server.js"]