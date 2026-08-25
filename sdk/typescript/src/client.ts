import {
  MyCepError,
  type MyCepAddress,
  type MyCepCompany,
  type MyCepSuggestion,
  type MyCepValidation,
} from './types.js'

export interface MyCepClientOptions {
  /**
   * Subscriber key (`cep_live_…` / `cep_test_…`), created at
   * /app/api-keys. Omit to call the anonymous public endpoints, which are
   * rate limited per IP and carry no enrichment fields.
   *
   * A `cep_live_` key in browser code should be origin-restricted; a key
   * without restrictions belongs on a server.
   */
  apiKey?: string
  /** Defaults to the production API. */
  baseUrl?: string
  /** Injected in tests; defaults to the global `fetch`. */
  fetch?: typeof fetch
  /** Extra headers merged into every request. */
  headers?: Record<string, string>
}

const DEFAULT_BASE_URL = 'https://api.mycep.app.br'

export class MyCepClient {
  readonly #apiKey?: string
  readonly #baseUrl: string
  readonly #fetch: typeof fetch
  readonly #headers: Record<string, string>

  constructor(options: MyCepClientOptions = {}) {
    this.#apiKey = options.apiKey
    this.#baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '')
    this.#fetch = options.fetch ?? globalThis.fetch
    this.#headers = options.headers ?? {}
    if (typeof this.#fetch !== 'function') {
      throw new TypeError('MyCepClient precisa de uma implementação de fetch.')
    }
  }

  async lookupCep(cep: string): Promise<MyCepAddress> {
    const digits = cep.replace(/\D/g, '')
    return this.#request<MyCepAddress>(`/api/v1/search/cep/${encodeURIComponent(digits)}`)
  }

  async searchAddress(city: string, street: string): Promise<MyCepAddress[]> {
    const payload = await this.#request<{ addresses: MyCepAddress[] }>(
      `/api/v1/search/address/${encodeURIComponent(city)}/${encodeURIComponent(street)}`
    )
    return payload.addresses
  }

  /** Growth and above. Fewer than 3 characters returns an empty list. */
  async autocomplete(query: string, uf?: string): Promise<MyCepSuggestion[]> {
    const params = new URLSearchParams({ q: query })
    if (uf) params.set('uf', uf)
    const payload = await this.#request<{ suggestions: MyCepSuggestion[] }>(
      `/api/v1/search/autocomplete?${params.toString()}`
    )
    return payload.suggestions
  }

  /** Business and above. Throws a 404 `MyCepError` when nothing is in range. */
  async reverse(lat: number, lng: number): Promise<MyCepAddress> {
    const params = new URLSearchParams({ lat: String(lat), lng: String(lng) })
    return this.#request<MyCepAddress>(`/api/v1/search/reverse?${params.toString()}`)
  }

  async lookupCnpj(cnpj: string): Promise<MyCepCompany> {
    const digits = cnpj.replace(/\D/g, '')
    return this.#request<MyCepCompany>(`/api/v1/registry/cnpj/${encodeURIComponent(digits)}`)
  }

  async holidays(year: number, options: { uf?: string; ibge?: string } = {}) {
    const params = new URLSearchParams({ ano: String(year) })
    if (options.uf) params.set('uf', options.uf)
    if (options.ibge) params.set('ibge', options.ibge)
    return this.#request<{ ano: number; feriados: Array<Record<string, string | null>> }>(
      `/api/v1/registry/holidays?${params.toString()}`
    )
  }

  /**
   * Server-side validation, metered as one request. For a purely local check
   * with no network call, use the functions in `@mycep/sdk/validators`.
   */
  async validate(kind: MyCepValidation['kind'], value: string): Promise<MyCepValidation> {
    const params = new URLSearchParams({ valor: value })
    return this.#request<MyCepValidation>(
      `/api/v1/validate/${encodeURIComponent(kind)}?${params.toString()}`
    )
  }

  async #request<T>(path: string): Promise<T> {
    const headers: Record<string, string> = { accept: 'application/json', ...this.#headers }
    if (this.#apiKey) {
      headers.authorization = `Bearer ${this.#apiKey}`
    }

    const response = await this.#fetch(`${this.#baseUrl}${path}`, { method: 'GET', headers })
    const text = await response.text()
    let body: unknown = null
    try {
      body = text ? JSON.parse(text) : null
    } catch {
      body = null
    }

    if (!response.ok) {
      const payload = (body ?? {}) as { error?: string; message?: string }
      throw new MyCepError(
        response.status,
        payload.error ?? 'request_failed',
        payload.message ?? 'A requisição ao MyCEP falhou.'
      )
    }

    return body as T
  }
}

export function createMyCepClient(options: MyCepClientOptions = {}): MyCepClient {
  return new MyCepClient(options)
}

/** Convenience for a one-off lookup. */
export async function lookupCep(cep: string, options: MyCepClientOptions = {}) {
  return new MyCepClient(options).lookupCep(cep)
}
