# MVP de teste: Node sem dependências, roda como o usuário "node" (uid 1000) — no stack use MVP_CERT_UID=1000.

# Versão = commit do build, lida do .git (o Dokploy clona o repositório com .git; o GitHub Actions também).
FROM alpine/git AS versao
WORKDIR /repo
COPY . .
RUN (git rev-parse --short=7 HEAD 2>/dev/null || echo "") > /versao

FROM node:22-alpine
WORKDIR /app
COPY server.js .
COPY --from=versao /versao /app/VERSION
# APP_VERSION (ex.: tag vinda do GitHub Actions) tem prioridade sobre o commit do arquivo VERSION.
ARG APP_VERSION=
ENV APP_VERSION=$APP_VERSION NODE_ENV=production
USER node
EXPOSE 8443
CMD ["node", "server.js"]
