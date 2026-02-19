FROM node:20-alpine

# alpine base images are minimal and often lack CA certificates
# which are required for TLS connections (e.g. Atlas +srv URI).
# install them before running npm so there is no SSL handshake failure.
RUN apk add --no-cache ca-certificates && update-ca-certificates

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

COPY src ./src

CMD ["node", "src/seed_all.js"]
