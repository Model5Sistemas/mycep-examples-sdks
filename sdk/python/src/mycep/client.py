"""Cliente HTTP da API MyCEP."""
from __future__ import annotations

import re
from typing import Any

import requests

DEFAULT_BASE_URL = "https://api.mycep.app.br"
DEFAULT_TIMEOUT = 10


class MyCepError(Exception):
    """Erro da API, com o código estável devolvido em `error`."""

    def __init__(self, status: int, code: str, message: str) -> None:
        super().__init__(message)
        self.status = status
        self.code = code

    @property
    def is_quota_exceeded(self) -> bool:
        """429 — a cota mensal do plano acabou."""
        return self.status == 429

    @property
    def is_plan_upgrade_required(self) -> bool:
        """403 — o endpoint existe, mas o plano não o inclui."""
        return self.status == 403


class MyCepClient:
    """Cliente síncrono.

    A chave é opcional: sem ela as rotas públicas respondem sob o limite de
    5 consultas por minuto por IP, e sem os campos de enriquecimento.
    """

    def __init__(
        self,
        api_key: str | None = None,
        base_url: str = DEFAULT_BASE_URL,
        timeout: int = DEFAULT_TIMEOUT,
        session: requests.Session | None = None,
    ) -> None:
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self._session = session or requests.Session()

    def lookup_cep(self, cep: str) -> dict[str, Any]:
        digitos = re.sub(r"\D", "", cep)
        if len(digitos) != 8:
            raise MyCepError(400, "invalid_cep", "CEP precisa de 8 dígitos.")
        return self._get(f"/api/v1/search/cep/{digitos}")

    def search_address(self, cidade: str, logradouro: str) -> list[dict[str, Any]]:
        payload = self._get(f"/api/v1/search/address/{cidade}/{logradouro}")
        return payload.get("addresses", [])

    def autocomplete(self, query: str, uf: str | None = None) -> list[dict[str, Any]]:
        """Growth ou superior. Menos de 3 caracteres devolve lista vazia."""
        params: dict[str, str] = {"q": query}
        if uf:
            params["uf"] = uf
        return self._get("/api/v1/search/autocomplete", params=params).get("suggestions", [])

    def reverse(self, lat: float, lng: float) -> dict[str, Any]:
        """Business ou superior. Levanta MyCepError 404 se nada estiver no raio."""
        return self._get("/api/v1/search/reverse", params={"lat": str(lat), "lng": str(lng)})

    def lookup_cnpj(self, cnpj: str) -> dict[str, Any]:
        digitos = re.sub(r"\D", "", cnpj)
        return self._get(f"/api/v1/registry/cnpj/{digitos}")

    def holidays(self, year: int, uf: str | None = None, ibge: str | None = None) -> dict[str, Any]:
        params: dict[str, str] = {"ano": str(year)}
        if uf:
            params["uf"] = uf
        if ibge:
            params["ibge"] = ibge
        return self._get("/api/v1/registry/holidays", params=params)

    def _get(self, path: str, params: dict[str, str] | None = None) -> dict[str, Any]:
        headers = {"Accept": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        resposta = self._session.get(
            f"{self.base_url}{path}", headers=headers, params=params, timeout=self.timeout
        )

        corpo: dict[str, Any] = {}
        try:
            corpo = resposta.json()
        except ValueError:
            pass

        if resposta.status_code != 200:
            raise MyCepError(
                resposta.status_code,
                corpo.get("error", "request_failed"),
                corpo.get("message", "Falha na consulta ao MyCEP."),
            )
        return corpo
