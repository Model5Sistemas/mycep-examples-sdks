/**
 * MyCEP — TypeScript / Node 20+.
 *   MYCEP_API_KEY=cep_live_... npx tsx consulta.ts 01001000
 *
 * Sem dependência: usa o `fetch` nativo. O SDK oficial (../../sdk/typescript)
 * faz o mesmo com tipos prontos.
 */
const BASE = process.env.MYCEP_BASE ?? 'https://api.mycep.app.br'

export interface Endereco {
  cep: string
  tipoLogradouro: string | null
  logradouro: string
  bairro: string | null
  cidade: string
  uf: string
  ibge: string
  latitude?: number
  longitude?: number
}

export class MyCepError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string
  ) {
    super(message)
  }
}

export async function buscarCep(cep: string): Promise<Endereco> {
  const digitos = cep.replace(/\D/g, '')
  if (digitos.length !== 8) throw new MyCepError(400, 'invalid_cep', 'CEP precisa de 8 dígitos.')

  const headers: Record<string, string> = { accept: 'application/json' }
  if (process.env.MYCEP_API_KEY) {
    headers.authorization = `Bearer ${process.env.MYCEP_API_KEY}`
  }

  const resposta = await fetch(`${BASE}/api/v1/search/cep/${digitos}`, {
    headers,
    signal: AbortSignal.timeout(10_000),
  })

  if (!resposta.ok) {
    const corpo = (await resposta.json().catch(() => ({}))) as { error?: string; message?: string }
    throw new MyCepError(
      resposta.status,
      corpo.error ?? 'request_failed',
      corpo.message ?? 'Falha na consulta.'
    )
  }
  return (await resposta.json()) as Endereco
}

if (import.meta.url === `file://${process.argv[1]}`) {
  buscarCep(process.argv[2] ?? '01001000')
    .then((e) => console.log(`${e.logradouro} — ${e.cidade}/${e.uf} (IBGE ${e.ibge})`))
    .catch((e: MyCepError) => {
      console.error(`[${e.code}] ${e.message}`)
      process.exit(1)
    })
}
