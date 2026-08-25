# Widget no navegador

Abra o `index.html` — não precisa de servidor nem build.

Troque `data-mycep-key` por uma chave sua **restrita por origem**. Sem restrição, ela
funciona de qualquer lugar; com restrição, o navegador só consegue usá-la nos seus
domínios. Chamadas de servidor não enviam `Origin` e não são afetadas.

Eventos emitidos: `mycep:filled` (com o endereço em `detail`) e `mycep:error`.
