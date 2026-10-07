FROM node:22-alpine

RUN apk add --no-cache curl postgresql-client

WORKDIR /app

# 1. Copiar manifiestos de paquetes para aprovechar caché de Docker
COPY package.json package-lock.json* ./
COPY packages/shared/package*.json ./packages/shared/
COPY services/api-backend/package*.json ./services/api-backend/
COPY apps/web-app/package*.json ./apps/web-app/

# 2. Instalar dependencias del monorrepitorio
RUN npm install

# 3. Copiar código fuente del paquete compartido y compilarlo
COPY packages/shared ./packages/shared
RUN cd /app/packages/shared && npm run build

# 4. Copiar código fuente y datos del backend
COPY services/api-backend ./services/api-backend

# 5. Configurar script de inicio
COPY services/api-backend/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

WORKDIR /app/services/api-backend

EXPOSE 8000

ENTRYPOINT ["/docker-entrypoint.sh"]
