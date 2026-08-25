# cURL

```bash
./consulta.sh 01001000                      # rota pública, 5/min por IP
MYCEP_API_KEY=cep_live_... ./consulta.sh 01001000
```

O script trata os status que a API devolve em vez de assumir sucesso — é o mínimo
para não quebrar em produção quando a cota acabar.
