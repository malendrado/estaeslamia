# Contexto de build: raíz del workspace (ver docker-compose.yml -> context: .)
FROM node:20-alpine

WORKDIR /workspace

COPY package.json package-lock.json* ./
COPY frontend/package.json ./frontend/package.json

RUN npm install --workspace=frontend --include-workspace-root

COPY frontend ./frontend

WORKDIR /workspace/frontend

EXPOSE 4200

CMD ["npm", "start"]
