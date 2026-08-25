# Servidor MCP

O MyCEP expõe um servidor [Model Context Protocol](https://modelcontextprotocol.io) em
`https://mcp.mycep.app.br/mcp` (Streamable HTTP). Assim um agente consulta CEP sem que
você escreva integração.

## Configuração

Crie uma chave do tipo **MCP** em
[mycep.app.br/app/api-keys](https://www.mycep.app.br/app/api-keys) e aponte o cliente:

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

Funciona em Claude Desktop, Cursor e qualquer cliente compatível.

## Ferramentas

| Ferramenta | O que faz | Plano |
|---|---|---|
| `buscar_cep` | endereço completo a partir do CEP | qualquer |
| `buscar_endereco` | CEPs por cidade e logradouro, tolerante a erro de digitação | qualquer |
| `buscar_cidades` | cidades por nome ou UF, com código IBGE | qualquer |
| `buscar_cidade_ibge` | cidade a partir do código IBGE | qualquer |
| `sugerir_logradouro` | autocomplete | Growth+ |
| `geocodificar_reverso` | endereço mais próximo de uma coordenada | Business+ |

Ferramenta que o plano não inclui **não aparece** na lista do agente — ele não tenta
chamar o que não pode usar.

## Cota

Chamadas via MCP consomem a mesma cota mensal da API REST. Ao esgotar, a ferramenta
devolve o aviso como resultado de erro, e o agente consegue explicar o motivo ao usuário
em vez de falhar em silêncio.
