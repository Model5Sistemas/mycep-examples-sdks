"""MyCEP — Python 3.9+.

    MYCEP_API_KEY=cep_live_... python consulta.py 01001000

Única dependência: requests.
"""
from __future__ import annotations

import os
import re
import sys

import requests

BASE = os.environ.get("MYCEP_BASE", "https://api.mycep.app.br")


class MyCepError(Exception):
    def __init__(self, status: int, code: str, message: str) -> None:
        super().__init__(message)
        self.status = status
        self.code = code


def buscar_cep(cep: str) -> dict:
    digitos = re.sub(r"\D", "", cep)
    if len(digitos) != 8:
        raise MyCepError(400, "invalid_cep", "CEP precisa de 8 dígitos.")

    headers = {"Accept": "application/json"}
    chave = os.environ.get("MYCEP_API_KEY")
    if chave:
        headers["Authorization"] = f"Bearer {chave}"

    resposta = requests.get(
        f"{BASE}/api/v1/search/cep/{digitos}", headers=headers, timeout=10
    )
    if resposta.status_code != 200:
        corpo = {}
        try:
            corpo = resposta.json()
        except ValueError:
            pass
        raise MyCepError(
            resposta.status_code,
            corpo.get("error", "request_failed"),
            corpo.get("message", "Falha na consulta."),
        )
    return resposta.json()


if __name__ == "__main__":
    try:
        endereco = buscar_cep(sys.argv[1] if len(sys.argv) > 1 else "01001000")
    except MyCepError as erro:
        print(f"[{erro.code}] {erro}", file=sys.stderr)
        raise SystemExit(1)
    print(f"{endereco['logradouro']} — {endereco['cidade']}/{endereco['uf']}")
