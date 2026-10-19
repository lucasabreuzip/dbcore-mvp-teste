// MVP mínimo de teste para o DB Core Hub (Node, sem dependências).
// Segue o padrão: HTTPS só na 8443 com mTLS (aceita apenas o gateway do projeto), usuário só do header X-Hub-Context,
// permissão por operação e manifesto em /.well-known/dbcore.json com a versão do código (APP_VERSION).
"use strict";
const fs = require("fs");
const https = require("https");

const env = (name, fallback) => process.env[name] || fallback;
const slug = env("Mvp__ProjectSlug", "");
// Versão: APP_VERSION (build-arg) ou o commit gravado em /app/VERSION no build.
const fileVersion = (() => {
  try {
    return fs.readFileSync("/app/VERSION", "utf8").trim();
  } catch {
    return "";
  }
})();
const version = env("APP_VERSION", "") || fileVersion || null;
// Commit (hash completo) e repositório: informados no manifesto para o hub mostrar o link do commit.
const fileCommit = (() => {
  try {
    return fs.readFileSync("/app/COMMIT", "utf8").trim();
  } catch {
    return "";
  }
})();
const commit = env("APP_COMMIT", "") || fileCommit || null;
const repository = env("APP_REPOSITORY", "") || null;

const manifest = {
  version,
  commit,
  repository,
  permissions: [{ code: "teste.ver", name: "Ver a página de teste" }],
  roles: [{ code: "leitor", name: "Leitor", permissions: ["teste.ver"] }]
};

function send(res, status, body, type = "application/json; charset=utf-8") {
  res.writeHead(status, { "Content-Type": type, "X-Content-Type-Options": "nosniff" });
  res.end(typeof body === "string" ? body : JSON.stringify(body));
}

/** Contexto do usuário: só do header do gateway, conferindo o projeto. Ausente/inválido = anônimo. */
function hubContext(req) {
  const raw = req.headers["x-hub-context"];
  if (!raw) return null;
  try {
    const ctx = JSON.parse(Buffer.from(String(raw), "base64url").toString("utf8"));
    return ctx.projectSlug === slug ? ctx : null;
  } catch {
    return null;
  }
}

const escape = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const server = https.createServer(
  {
    cert: fs.readFileSync(env("Mvp__ServerCertificatePath", "/pki/certs/mvp.crt")),
    key: fs.readFileSync(env("Mvp__ServerCertificateKeyPath", "/pki/certs/mvp.key")),
    ca: fs.readFileSync(env("Mvp__CaPath", "/pki/certs/ca.crt")),
    requestCert: true,
    rejectUnauthorized: true
  },
  (req, res) => {
    // mTLS: além de assinado pela CA do stack, o certificado precisa ser do gateway deste projeto.
    const cn = req.socket.getPeerCertificate()?.subject?.CN;
    if (cn !== `gateway.${slug}`) return send(res, 403, { error: "client_certificate" });

    const path = new URL(req.url, "https://mvp").pathname;
    if (req.method === "GET" && path === "/.well-known/dbcore.json") return send(res, 200, manifest);

    const ctx = hubContext(req);
    if (!ctx) return send(res, 401, { error: "hub_context_required" });
    if (!Array.isArray(ctx.permissions) || !ctx.permissions.includes("teste.ver")) return send(res, 403, { error: "forbidden" });

    if (req.method === "GET" && path === "/api/info") return send(res, 200, { version, user: ctx.email, role: ctx.role?.name ?? null });
    if (req.method === "GET" && path === "/")
      return send(
        res,
        200,
        `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>MVP de teste</title>
<body style="font-family:system-ui;margin:3rem;color:#0b1a17">
<h1>MVP de teste (GitHub) — busca</h1>
<p>Versão em execução: <b>${escape(version ?? "não informada")}</b></p>
<p>Você entrou como <b>${escape(ctx.name ?? ctx.email)}</b> (${escape(ctx.role?.name ?? "")}).</p>
<p style="color:#5d6f69">Rodapé da feature.</p>
<p><a href="/_gateway/login?saiu=1" onclick="fetch('/_gateway/logout',{method:'POST'});return true">Sair do projeto</a></p>
</body></html>`,
        "text/html; charset=utf-8"
      );
    return send(res, 404, { error: "not_found" });
  }
);

server.listen(8443, () => console.log(`MVP de teste na 8443 (projeto ${slug}, versão ${version ?? "não informada"})`));
