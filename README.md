# dbcore-mvp-teste

MVP mínimo de **teste** para o DB Core Hub (identidade e acesso dos MVPs). Não contém código do hub nem dados.

- `server.js`: HTTPS 8443 com mTLS (aceita só o gateway do projeto), usuário pelo header `X-Hub-Context`,
  permissão `teste.ver`, manifesto em `/.well-known/dbcore.json` com `version` (commit/tag gravado no build).
- `.github/workflows/publicar-imagem.yml`: a cada push na `main` publica `ghcr.io/<conta>/dbcore-mvp-teste:<commit>`;
  a cada tag `vX.Y.Z`, `...:X.Y.Z`.

No Dokploy, stack do projeto: `MVP_IMAGE=ghcr.io/<conta>/dbcore-mvp-teste:<tag>` e `MVP_CERT_UID=1000`
(o container roda como o usuário `node`).
