<div align="center">

# MyCEP

### A API de CEP e endereços do Brasil que funciona onde o seu código roda

**1.502.228 CEPs** · autenticação por chave Bearer · sem exigir IP fixo
Enriquecimento geográfico e fiscal · autocomplete · higienização em lote · servidor MCP

[![Documentação](https://img.shields.io/badge/docs-mycep.app.br%2Fdocs-4f46e5?style=flat-square)](https://www.mycep.app.br/docs)
[![OpenAPI](https://img.shields.io/badge/OpenAPI-3.1-16a34a?style=flat-square)](https://www.mycep.app.br/openapi.json)
[![Plano Free](https://img.shields.io/badge/gr%C3%A1tis-500%20consultas%2Fm%C3%AAs-0ea5e9?style=flat-square)](https://www.mycep.app.br/plans)
[![Licença](https://img.shields.io/badge/licen%C3%A7a-MIT-64748b?style=flat-square)](./LICENSE)

</div>

---

## Consulte um CEP agora, sem cadastro

```bash
curl https://api.mycep.app.br/api/v1/search/cep/01001000
```

```json
{
  "cep": "01001-000",
  "tipoLogradouro": null,
  "logradouro": "PRACA DA SE",
  "bairro": "SE",
  "cidade": "São Paulo",
  "uf": "SP",
  "ibge": "3550308"
}
```

Sem chave, a rota pública responde **5 consultas por minuto por IP**. Para produção,
[crie uma chave gratuita](https://www.mycep.app.br/signup) — 500 consultas/mês, sem cartão.

---

## Por que não usar o IP para autenticar

Backends modernos não têm IP de saída estável: função serverless, container que reescala,
função de borda, CI. Cadastrar IP significa quebrar em produção no dia em que a
infraestrutura mudar.

No MyCEP a identidade é a **chave**, enviada no cabeçalho:

```bash
curl https://api.mycep.app.br/api/v1/search/cep/01001000 \
  -H "Authorization: Bearer cep_live_sua_chave_aqui"
```

Restringir a chave a IPs ou origens continua possível — só deixou de ser obrigatório.

> A chave é exibida **uma única vez**, na criação. O servidor guarda apenas um hash.
> Rotacionar significa criar outra e revogar a antiga, como no Stripe e no GitHub.

---

## Escolha a sua linguagem

| | | |
|---|---|---|
| [cURL](./examples/curl) | [TypeScript / Node](./examples/typescript) | [Python](./examples/python) |
| [PHP](./examples/php) | [Java](./examples/java) | [C#/.NET](./examples/csharp) |
| [Ruby on Rails](./examples/rails) | [Go](./examples/go) | [Widget no navegador](./examples/browser-widget) |

Cada pasta tem um exemplo **executável**, com tratamento de erro e leitura da chave do
ambiente — não um trecho solto que quebra na primeira exceção.

### TypeScript, com o SDK

```ts
import { MyCepClient } from '@mycep/sdk'

const mycep = new MyCepClient({ apiKey: process.env.MYCEP_API_KEY })

const endereco = await mycep.lookupCep('01001-000')
console.log(endereco.logradouro, endereco.cidade, endereco.uf)
```

### Python, sem dependência além de `requests`

```python
import os, requests

r = requests.get(
    "https://api.mycep.app.br/api/v1/search/cep/01001000",
    headers={"Authorization": f"Bearer {os.environ['MYCEP_API_KEY']}"},
    timeout=10,
)
r.raise_for_status()
print(r.json()["logradouro"])
```

---

## Preenchimento de endereço no checkout, em uma linha

O maior ganho de conversão em e-commerce brasileiro é não fazer o cliente digitar o
endereço. O widget faz isso sem você escrever JavaScript:

```html
<input name="cep" placeholder="CEP" />
<input name="logradouro" /><input name="bairro" />
<input name="cidade" /><input name="uf" />

<script src="https://api.mycep.app.br/widget.js"
        data-mycep-key="cep_live_sua_chave_aqui"
        data-mycep-cep="[name='cep']"
        data-mycep-logradouro="[name='logradouro']"
        data-mycep-bairro="[name='bairro']"
        data-mycep-cidade="[name='cidade']"
        data-mycep-uf="[name='uf']"></script>
```

A chave fica visível no HTML — isso é esperado. **Restrinja-a por origem** na sua conta e
ela só responde aos seus domínios. Exemplo completo em
[`examples/browser-widget`](./examples/browser-widget).

---

## O que a API entrega além do endereço

| Recurso | Endpoint | A partir de |
|---|---|---|
| Endereço por CEP | `GET /api/v1/search/cep/:cep` | Free |
| Busca por cidade e logradouro | `GET /api/v1/search/address/:cidade/:logradouro` | Free |
| Coordenadas, SIAFI, DDD, regiões IBGE, fuso | campos extras na busca | Growth |
| Autocomplete de logradouro | `GET /api/v1/search/autocomplete?q=` | Growth |
| Validadores: CEP, CPF, CNPJ, telefone, PIX | `GET /api/v1/validate/:kind` | Growth |
| Geocoding reverso | `GET /api/v1/search/reverse?lat=&lng=` | Business |
| CNPJ e calendário de feriados | `GET /api/v1/registry/...` | Business |
| Higienização de listas (CSV) | pela área da conta | Growth |

Os campos de enriquecimento são **omitidos**, nunca preenchidos com `null`, quando o plano
não os inclui. Assim o seu parser não precisa distinguir "não tenho" de "não posso ver".

Referência completa e "executar no navegador": **[mycep.app.br/docs](https://www.mycep.app.br/docs)**

---

## Servidor MCP: consulte CEP direto do seu agente de IA

O MyCEP expõe um servidor [MCP](https://modelcontextprotocol.io) nativo. Claude, Cursor e
qualquer cliente compatível consultam a base sem você escrever integração:

```json
{
  "mcpServers": {
    "mycep": {
      "type": "http",
      "url": "https://mcp.mycep.app.br/mcp",
      "headers": { "Authorization": "Bearer mcp_live_sua_chave_aqui" }
    }
  }
}
```

Detalhes em [`docs/mcp.md`](./docs/mcp.md).

---

## Erros: previsíveis e sem surpresa

Toda falha devolve um código estável em `error`, para você tratar sem interpretar texto:

| Status | `error` | O que fazer |
|---|---|---|
| `400` | `invalid_cep`, `invalid_coordinates` | corrigir a entrada |
| `401` | `invalid_api_key` | chave errada, revogada ou fora da restrição |
| `403` | `plan_upgrade_required` | recurso não incluído no plano |
| `404` | `not_found` | CEP inexistente na base |
| `429` | `quota_exceeded` | cota do mês esgotada — o corpo traz `resetsAt` |
| `503` | `dataset_unavailable` | base cadastral ainda não carregada |

A mensagem de autenticação é sempre a mesma, independentemente do motivo — de propósito,
para não virar oráculo de sondagem. Detalhes em [`docs/erros.md`](./docs/erros.md).

---

## Planos

| | Free | Starter | Growth | Business |
|---|---|---|---|---|
| Consultas/mês | 500 | 25.000 | 150.000 | 600.000 |
| Preço | R$ 0 | R$ 29,90 | R$ 89,00 | R$ 249,00 |
| Chaves | 1 | ilimitadas | ilimitadas | ilimitadas |
| Coordenadas e dados fiscais | — | — | ✓ | ✓ |
| Autocomplete | — | — | ✓ | ✓ |
| Geocoding reverso | — | — | — | ✓ |
| CNPJ e feriados | — | — | — | ✓ |

Anual custa 10 mensalidades — dois meses grátis. Operamos com **disponibilidade-alvo de
99,9%**; SLA contratual e IP dedicado fazem parte do plano Enterprise.

[Ver planos](https://www.mycep.app.br/plans) · [Criar conta grátis](https://www.mycep.app.br/signup)

---

## Este repositório

```
examples/    um exemplo executável por linguagem
sdk/         clientes prontos (TypeScript e Python)
docs/        autenticação, erros e MCP em detalhe
```

**Não há código do MyCEP aqui.** É um repositório de integração: o que você precisa para
consumir a API, e nada do que roda do nosso lado.

Achou um erro num exemplo, ou quer o seu idioma favorito na lista? Abra uma issue ou um PR —
código de exemplo é MIT, use como quiser.

---

<div align="center">

**[mycep.app.br](https://www.mycep.app.br)** · [Documentação](https://www.mycep.app.br/docs) · [Planos](https://www.mycep.app.br/plans)

</div>
