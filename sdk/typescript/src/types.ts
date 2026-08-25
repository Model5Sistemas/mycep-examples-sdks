/** Payload of `/api/v1/search/*`. Enrichment fields are present only when the
 *  key's plan includes them and the data exists. */
export interface MyCepAddress {
  cep: string
  tipoLogradouro: string | null
  logradouro: string
  bairro: string | null
  cidade: string
  uf: string
  ibge: string
  latitude?: number
  longitude?: number
  geoPrecision?: 'street' | 'city'
  siafi?: string
  ddd?: string
  timezone?: string
  ibgeMesoregion?: string
  ibgeMicroregion?: string
  ibgeImmediateRegion?: string
  ibgeIntermediateRegion?: string
}

export interface MyCepSuggestion {
  cep: string
  tipoLogradouro: string | null
  logradouro: string
  bairro: string | null
  cidade: string
  uf: string
}

export interface MyCepValidation {
  kind: 'cep' | 'cpf' | 'cnpj' | 'phone' | 'pix'
  valid: boolean
  normalized: string | null
  type?: string
}

export interface MyCepCompany {
  cnpj: string
  razaoSocial: string
  nomeFantasia: string | null
  cnae: string | null
  cnaeDescricao: string | null
  situacaoCadastral: string | null
  endereco: Record<string, string | null>
}

/**
 * The API answers errors with a stable machine code and a human message.
 * `status` is the HTTP status so callers can branch without parsing text.
 */
export class MyCepError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'MyCepError'
    this.status = status
    this.code = code
  }

  /** 429 — the plan's monthly quota is spent. */
  get isQuotaExceeded(): boolean {
    return this.status === 429
  }

  /** 403 — the endpoint exists but the plan does not include it. */
  get isPlanUpgradeRequired(): boolean {
    return this.status === 403
  }
}
