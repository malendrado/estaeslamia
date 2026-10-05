# Contexto de build: raíz del workspace (ver docker-compose.yml -> context: .)
FROM node:20-alpine

WORKDIR /workspace

# Copiamos solo los manifiestos primero para aprovechar cache de capas de Docker
COPY package.json package-lock.json* ./
COPY backend/package.json ./backend/package.json

# npm workspaces resuelve e hidrata node_modules compartido en la raíz
RUN npm install --workspace=backend --include-workspace-root

# Ahora copiamos el resto del código del backend
COPY backend ./backend

WORKDIR /workspace/backend

EXPOSE 3000

CMD ["npm", "run", "start:dev"]
