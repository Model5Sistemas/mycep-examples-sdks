# Ruby on Rails

```bash
ruby my_cep.rb 01001000
MYCEP_API_KEY=cep_live_... ruby my_cep.rb 01001000
```

Só biblioteca padrão. Em Rails, mova para `app/services/` e troque `ENV` por
`Rails.application.credentials.mycep_api_key`.
