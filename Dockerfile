FROM node:20-alpine

# alpine base images are minimal and often lack CA certificates
# which are required for TLS connections (e.g. Atlas +srv URI).
# also install openssl to ensure the runtime has the full set of
# cipher suites and crypto primitives; without it the handshake can
# fail with `tlsv1 alert internal error`.
RUN apk add --no-cache ca-certificates openssl && update-ca-certificates

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

COPY src ./src

CMD ["node", "src/seed_all.js"]
