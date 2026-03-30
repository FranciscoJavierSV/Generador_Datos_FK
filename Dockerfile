# IMAGEN: Node.js Debian slim con OpenSSL completo para TLS
FROM node:20-slim

# METADATA: Inyectar commit hash para debugging
ARG GIT_COMMIT=unspecified
ENV GIT_COMMIT=$GIT_COMMIT

# SETUP: Configurar directorio de trabajo
WORKDIR /app

# DEPENDENCIAS: Copiar y instalar
COPY package*.json ./
RUN npm install --omit=dev

# CODIGO: Copiar codigo fuente
COPY src ./src

# VOLUMEN: Crear directorio para datos
RUN mkdir -p /app/data

# EJECUCION: Comando por defecto
CMD ["node", "src/seeders/seed_all.js"]
