#!/usr/bin/env bash
# MyCEP — consulta de CEP com cURL.
#   MYCEP_API_KEY=cep_live_... ./consulta.sh 01001000
set -euo pipefail

BASE="${MYCEP_BASE:-https://api.mycep.app.br}"
CEP="$(printf '%s' "${1:-01001000}" | tr -cd '0-9')"

[ ${#CEP} -eq 8 ] || { echo "Informe um CEP com 8 dígitos." >&2; exit 2; }

# Sem chave a rota pública responde (5/min por IP) e sem enriquecimento.
AUTH=()
[ -n "${MYCEP_API_KEY:-}" ] && AUTH=(-H "Authorization: Bearer ${MYCEP_API_KEY}")

RESPONSE="$(mktemp)"
trap 'rm -f "$RESPONSE"' EXIT

STATUS="$(curl -sS -o "$RESPONSE" -w '%{http_code}' --max-time 10 \
  "${AUTH[@]}" "${BASE}/api/v1/search/cep/${CEP}")"

case "$STATUS" in
  200) cat "$RESPONSE" ;;
  404) echo "CEP não encontrado." >&2; exit 1 ;;
  429) echo "Cota ou limite por minuto excedido." >&2; exit 1 ;;
  401) echo "Chave inválida, revogada ou fora da restrição." >&2; exit 1 ;;
  *)   echo "Falha inesperada (HTTP $STATUS)." >&2; exit 1 ;;
esac
