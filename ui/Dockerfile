FROM node:20.10.0 AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM dependencies AS development
COPY . .
EXPOSE 3001
CMD ["npm", "run", "start"]

FROM development AS test
ENV CI=true
CMD ["npm", "test", "--", "--watchAll=false"]

FROM development AS build
RUN npm run build

FROM nginx:1.27.5-alpine AS production
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
