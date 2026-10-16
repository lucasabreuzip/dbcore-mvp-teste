# MVP de teste: Node sem dependências, roda como o usuário "node" (uid 1000) — no stack use MVP_CERT_UID=1000.
FROM node:22-alpine
WORKDIR /app
COPY server.js .
# Versão do código gravada no build (o GitHub Actions passa o commit ou a tag); vai no manifesto em "version".
ARG APP_VERSION=
ENV APP_VERSION=$APP_VERSION NODE_ENV=production
USER node
EXPOSE 8443
CMD ["node", "server.js"]
