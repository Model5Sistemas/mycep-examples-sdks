# Autenticação

## Sem chave

As rotas públicas de busca respondem sem autenticação, sob **5 consultas por minuto por
IP** e **sem campos de enriquecimento**. Violações repetidas bloqueiam o IP por 24 horas.

Serve para testar. Não serve para produção.

## Com chave

```
Authorization: Bearer cep_live_...
```

A chave é criada em [mycep.app.br/app/api-keys](https://www.mycep.app.br/app/api-keys) e
**exibida por inteiro uma única vez**. O servidor guarda apenas um hash — não há tela onde
recuperá-la depois. Rotacionar é criar outra e revogar a antiga.

### Prefixos

| Prefixo | Onde vale |
|---|---|
| `cep_live_` | API REST, produção |
| `cep_test_` | API REST, testes |
| `mcp_live_` / `mcp_test_` | apenas `POST /mcp` |

Uma chave `mcp_` enviada à API REST é recusada com 401 — e o contrário também. A separação
é proposital: revogar o acesso do seu agente de IA não derruba o seu backend.

### Restrições opcionais

Cada chave aceita listas de **IPs** e de **origens**:

- **IP** — se houver algum cadastrado, só aqueles são aceitos. Vazio significa "qualquer".
- **Origem** — vale para chamadas de navegador. Requisição sem `Origin`/`Referer` é
  tratada como servidor e passa; é assim que o widget fica seguro sem quebrar o backend.

Ambas falham fechado: o que não bate é recusado.

## Onde guardar

| Contexto | Como |
|---|---|
| Backend | variável de ambiente, nunca no código |
| CI | secret do provedor |
| Navegador (widget) | chave dedicada, **restrita por origem** |

A chave no HTML do widget é pública por natureza — a restrição de origem é o que a torna
aceitável. Nunca use nela a mesma chave do backend.

## Erro genérico, de propósito

Chave inexistente, revogada, de tipo errado, IP fora da lista ou origem não autorizada
devolvem **a mesma resposta**:

```json
{ "error": "invalid_api_key", "message": "Autenticação falhou." }
```

Diferenciar os motivos transformaria o endpoint num oráculo para descobrir quais chaves
existem.
