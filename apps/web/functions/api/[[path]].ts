// Pages Function: en Cloudflare, /api/* se reenvía al Worker por el service binding API
// (lo declara Terraform en infra/terraform). Así la web sigue llamando a su mismo origen,
// sin CORS, igual que el proxy de Vite en local. No se usa en `pnpm dev`.
type Contexto = {
  request: Request
  env: { API: { fetch: (request: Request) => Promise<Response> } }
}

export const onRequest = ({ request, env }: Contexto) => env.API.fetch(request)
