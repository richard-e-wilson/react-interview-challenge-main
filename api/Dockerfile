FROM node:20.10.0 AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM dependencies AS development
COPY . .
EXPOSE 3000
CMD ["npm", "run", "start:dev"]

FROM development AS test
CMD ["npm", "test", "--", "--runInBand"]

FROM development AS build
RUN npm run build

FROM node:20.10.0-slim AS production
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/build ./build
USER node
EXPOSE 3000
CMD ["node", "build/index.js"]
