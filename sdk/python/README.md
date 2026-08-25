# `mycep`

Cliente Python da [API MyCEP](https://www.mycep.app.br).

```bash
pip install mycep
```

```python
from mycep import MyCepClient

mycep = MyCepClient(api_key="cep_live_...")

endereco = mycep.lookup_cep("01001-000")
sugestoes = mycep.autocomplete("Av Pau", uf="SP")   # Growth+
proximo = mycep.reverse(-23.5505, -46.6333)         # Business+
```

Validadores locais, sem rede e sem consumir cota:

```python
from mycep import is_valid_cpf, is_valid_cnpj, classify_pix_key
```

## Erros

```python
from mycep import MyCepError

try:
    mycep.reverse(lat, lng)
except MyCepError as erro:
    if erro.is_plan_upgrade_required:  # 403
        ...
    if erro.is_quota_exceeded:         # 429
        ...
```

[Documentação](https://www.mycep.app.br/docs) · [Planos](https://www.mycep.app.br/plans) · MIT
