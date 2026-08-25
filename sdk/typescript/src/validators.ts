/**
 * Local check-digit and shape rules — the same algorithms the MyCEP API runs
 * server-side, so a form can validate before spending a billable request.
 *
 * These functions answer "is this a well-formed number?" — never "is this
 * number issued?". There is no bureau, RFB or bank call here.
 */

export type ValidatorKind = 'cep' | 'cpf' | 'cnpj' | 'phone' | 'pix'

export const VALIDATOR_KINDS: ValidatorKind[] = ['cep', 'cpf', 'cnpj', 'phone', 'pix']

export interface ValidationResult {
  kind: ValidatorKind
  valid: boolean
  /** Canonical form when valid — digits only, or the normalized key. */
  normalized: string | null
  /** For PIX: email | phone | cpf | cnpj | evp. */
  type?: string
}

function digitsOf(value: string): string {
  return value.replace(/\D/g, '')
}

export function isValidCep(raw: string): boolean {
  return digitsOf(raw).length === 8
}

export function isValidCpf(raw: string): boolean {
  const digits = digitsOf(raw)
  if (digits.length !== 11) return false
  // Repdigits satisfy the checksum arithmetic but are never issued.
  if (/^(\d)\1{10}$/.test(digits)) return false

  for (const [length, factor] of [
    [9, 10],
    [10, 11],
  ] as const) {
    let sum = 0
    for (let i = 0; i < length; i++) {
      sum += Number(digits[i]) * (factor - i)
    }
    const remainder = (sum * 10) % 11
    const expected = remainder === 10 ? 0 : remainder
    if (expected !== Number(digits[length])) return false
  }
  return true
}

export function isValidCnpj(raw: string): boolean {
  const digits = digitsOf(raw)
  if (digits.length !== 14) return false
  if (/^(\d)\1{13}$/.test(digits)) return false

  const weightsFirst = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const weightsSecond = [6, ...weightsFirst]

  for (const weights of [weightsFirst, weightsSecond]) {
    let sum = 0
    for (const [i, weight] of weights.entries()) {
      sum += Number(digits[i]) * weight
    }
    const remainder = sum % 11
    const expected = remainder < 2 ? 0 : 11 - remainder
    if (expected !== Number(digits[weights.length])) return false
  }
  return true
}

/**
 * Brazilian numbers: 10 digits (landline) or 11 (mobile, leading 9), with an
 * optional `55` country code. The country code is only stripped when the
 * length says so — `5512345678` is a valid 10-digit MS number, not `55` plus
 * eight digits.
 */
export function normalizeBrazilianPhone(raw: string): string | null {
  let digits = digitsOf(raw)
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) {
    digits = digits.slice(2)
  }
  if (digits.length !== 10 && digits.length !== 11) return null

  const ddd = Number(digits.slice(0, 2))
  if (ddd < 11 || ddd > 99) return null

  const third = digits.charAt(2)
  if (digits.length === 11) {
    return third === '9' ? digits : null
  }
  return ['2', '3', '4', '5'].includes(third) ? digits : null
}

export function isValidBrazilianPhone(raw: string): boolean {
  return normalizeBrazilianPhone(raw) !== null
}

const EMAIL_SHAPE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/
const EVP_SHAPE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * PIX keys are validated by *shape* only: this says nothing about whether the
 * key is registered at a bank, and the API response must not imply otherwise.
 */
export function classifyPixKey(raw: string): { type: string; normalized: string } | null {
  const value = raw.trim()
  if (!value) return null

  if (EMAIL_SHAPE.test(value)) {
    return { type: 'email', normalized: value.toLowerCase() }
  }
  if (EVP_SHAPE.test(value)) {
    return { type: 'evp', normalized: value.toLowerCase() }
  }

  const digits = digitsOf(value)
  if (digits.length === 11 && isValidCpf(digits)) {
    return { type: 'cpf', normalized: digits }
  }
  if (digits.length === 14 && isValidCnpj(digits)) {
    return { type: 'cnpj', normalized: digits }
  }
  const phone = normalizeBrazilianPhone(value)
  if (phone) {
    return { type: 'phone', normalized: `+55${phone}` }
  }
  return null
}

export function validate(kind: ValidatorKind, value: string): ValidationResult {
  switch (kind) {
    case 'cep': {
      const valid = isValidCep(value)
      return { kind, valid, normalized: valid ? digitsOf(value) : null }
    }
    case 'cpf': {
      const valid = isValidCpf(value)
      return { kind, valid, normalized: valid ? digitsOf(value) : null }
    }
    case 'cnpj': {
      const valid = isValidCnpj(value)
      return { kind, valid, normalized: valid ? digitsOf(value) : null }
    }
    case 'phone': {
      const normalized = normalizeBrazilianPhone(value)
      return { kind, valid: normalized !== null, normalized }
    }
    case 'pix': {
      const classified = classifyPixKey(value)
      return {
        kind,
        valid: classified !== null,
        normalized: classified?.normalized ?? null,
        type: classified?.type,
      }
    }
  }
}
