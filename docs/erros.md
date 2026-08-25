# Erros

Toda falha traz um código estável em `error`. Trate por ele, nunca pelo texto de
`message` — a mensagem pode mudar, o código não.

```json
{ "error": "quota_exceeded", "message": "...", "resetsAt": "2026-09-01T00:00:00-03:00" }
```

| Status | `error` | Significado | O que fazer |
|---|---|---|---|
| 400 | `invalid_cep` | CEP fora de 8 dígitos | corrigir a entrada |
| 400 | `invalid_coordinates` | lat/lng fora de faixa | validar antes de enviar |
| 400 | `invalid_cnpj` | dígitos verificadores errados | validar localmente antes (o SDK faz) |
| 401 | `invalid_api_key` | chave inválida, revogada ou fora da restrição | conferir a chave e as restrições |
| 403 | `plan_upgrade_required` | o recurso existe, o plano não o inclui | trocar de plano ou remover a chamada |
| 404 | `not_found` | CEP ou registro inexistente | tratar como "não encontrado", não como falha |
| 429 | `quota_exceeded` | cota do período esgotada | usar `resetsAt`; fazer backoff |
| 503 | `dataset_unavailable` | base cadastral ainda não carregada | tentar depois; não é erro seu |

## Diferença que importa: 404 e 503

`404` significa "procurei e não existe". `503` significa "não tenho a base carregada para
procurar". Tratar os dois igual faz seu sistema registrar ausência de dado onde houve
indisponibilidade.

## Repetir ou não

| Status | Repetir? |
|---|---|
| 400, 401, 403, 404 | não — repetir dá o mesmo resultado |
| 429 | sim, depois de `resetsAt` |
| 503, 5xx | sim, com backoff exponencial |

## Campos ausentes não são erro

Os campos de enriquecimento (`latitude`, `siafi`, `ddd`, `timezone`…) são **omitidos**
quando o plano não os inclui ou quando a base não tem o dado — nunca preenchidos com
`null`. Trate ausência com `if ('latitude' in endereco)` em vez de comparar com `null`.
