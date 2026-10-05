FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ARG VITE_API_URL=/api/afisha
ARG VITE_CDN_URL=/content/afisha
ENV VITE_API_URL=$VITE_API_URL VITE_CDN_URL=$VITE_CDN_URL
RUN npm run build

FROM alpine:3.22 AS runtime
LABEL org.opencontainers.image.source="https://github.com/Fren4okolate/film-react-nest"
COPY --from=build /app/dist /opt/frontend
COPY docker-entrypoint.sh /usr/local/bin/publish-frontend
RUN chmod +x /usr/local/bin/publish-frontend
ENTRYPOINT ["publish-frontend"]
