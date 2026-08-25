# TypeScript / Node

```bash
npm install
npm start -- 01001000
MYCEP_API_KEY=cep_live_... npm start -- 01001000
```

Node 20+ (usa `fetch` e `AbortSignal.timeout` nativos). `npm run typecheck` valida sem
executar — é o mesmo comando que o CI roda.

Para os demais endpoints com tipos prontos, use o [SDK](../../sdk/typescript).
