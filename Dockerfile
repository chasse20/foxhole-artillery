# DEV: Client
FROM node:22-alpine AS client-dev
WORKDIR /app/client

COPY client/package.json client/package-lock.json ./
RUN npm ci

COPY client/ ./

ENV NODE_ENV=development
EXPOSE 5173
CMD [ "npm","run","dev","--","--host","0.0.0.0","--port","5173" ]

# DEV: Server
FROM node:22-alpine AS server-dev
WORKDIR /app/server

COPY server/package*.json ./
RUN npm ci

COPY server/ ./

ENV NODE_ENV=development
ENV PORT=8080
EXPOSE 8080
CMD ["npm","run","dev"]


# PROD: Client
FROM node:22-alpine AS build
WORKDIR /app

COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
RUN npm run build


# PROD: Server
FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY server/package*.json ./
RUN npm ci --omit=dev
COPY server/ ./

COPY --from=build /app/dist ./dist

EXPOSE 8080
CMD ["node", "server.js"]