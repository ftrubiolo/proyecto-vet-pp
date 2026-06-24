FROM node:22-alpine

RUN apk add --no-cache curl

WORKDIR /app

# Cache layer: package files only
COPY package.json ./
COPY services/api-backend/package.json ./services/api-backend/
COPY packages/shared/package*.json ./packages/shared/
COPY apps/web-app/package.json ./apps/web-app/

RUN npm install

# Cache layer: shared config + source, build it
COPY packages/shared/tsconfig.json ./packages/shared/
COPY packages/shared/src ./packages/shared/src
WORKDIR /app/packages/shared
RUN npm run build

# Cache layer: backend entrypoint
WORKDIR /app
COPY services/api-backend/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 5000
ENTRYPOINT ["/docker-entrypoint.sh"]
