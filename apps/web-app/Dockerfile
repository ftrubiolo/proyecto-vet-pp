FROM node:22-alpine

WORKDIR /app

# Cache layer: package files only
COPY package.json ./
COPY apps/web-app/package*.json ./apps/web-app/
COPY packages/shared/package*.json ./packages/shared/
COPY services/api-backend/package.json ./services/api-backend/

RUN npm install

# Cache layer: shared config + source, build it
COPY packages/shared/tsconfig.json ./packages/shared/
COPY packages/shared/src ./packages/shared/src
WORKDIR /app/packages/shared
RUN npm run build

WORKDIR /app/apps/web-app
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
