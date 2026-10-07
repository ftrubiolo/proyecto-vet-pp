FROM node:22-alpine

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

# 4. Copiar código fuente del frontend
COPY apps/web-app ./apps/web-app

WORKDIR /app/apps/web-app

EXPOSE 8080

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
