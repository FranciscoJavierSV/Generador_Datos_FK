# switch to Debian slim image to get a complete OpenSSL stack and avoid
# Alpine-specific TLS quirks. The slim variant still keeps the image small
# but eliminates handshake errors with MongoDB Atlas.
FROM node:20-slim

# allow build to inject commit hash for debugging
ARG GIT_COMMIT=unspecified
ENV GIT_COMMIT=$GIT_COMMIT

# Debian images already include certificates and openssl, so no extra
# installation is required here. If you need additional packages you can
# add them with apt-get in future.

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

COPY src ./src

CMD ["node", "src/seed_all.js"]
