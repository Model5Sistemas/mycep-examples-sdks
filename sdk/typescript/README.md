# `@mycep/sdk`

Cliente TypeScript da [API MyCEP](https://www.mycep.app.br).

```bash
npm install @mycep/sdk
```

```ts
import { MyCepClient } from '@mycep/sdk'

const mycep = new MyCepClient({ apiKey: process.env.MYCEP_API_KEY })

const endereco = await mycep.lookupCep('01001-000')
const sugestoes = await mycep.autocomplete('Av Pau', 'SP') // Growth+
const proximo = await mycep.reverse(-23.5505, -46.6333)    // Business+
```

Validadores locais, sem rede e sem consumir cota:

```ts
import { isValidCpf, isValidCnpj, classifyPixKey } from '@mycep/sdk/validators'
```

São os mesmos algoritmos que a API roda no servidor — formato e dígitos verificadores.
Não afirmam que o número está emitido.

## Erros

```ts
import { MyCepError } from '@mycep/sdk'

try {
  await mycep.reverse(lat, lng)
} catch (erro) {
  if (erro instanceof MyCepError) {
    if (erro.isPlanUpgradeRequired) { /* 403 */ }
    if (erro.isQuotaExceeded) { /* 429 */ }
  }
}
```

[Documentação](https://www.mycep.app.br/docs) · [Planos](https://www.mycep.app.br/plans) · MIT
