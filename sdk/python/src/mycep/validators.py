"""Validadores locais: formato e dígitos verificadores.

Nenhuma chamada de rede, nenhum consumo de cota. Estes algoritmos respondem
"é um número bem-formado?" — nunca "este número está emitido?".
"""
from __future__ import annotations

import re

EMAIL_SHAPE = re.compile(r"^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$")
EVP_SHAPE = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", re.IGNORECASE
)


def _digits(value: str) -> str:
    return re.sub(r"\D", "", value)


def is_valid_cep(value: str) -> bool:
    return len(_digits(value)) == 8


def is_valid_cpf(value: str) -> bool:
    digits = _digits(value)
    if len(digits) != 11 or re.fullmatch(r"(\d)\1{10}", digits):
        return False
    for length, factor in ((9, 10), (10, 11)):
        total = sum(int(digits[i]) * (factor - i) for i in range(length))
        remainder = (total * 10) % 11
        expected = 0 if remainder == 10 else remainder
        if expected != int(digits[length]):
            return False
    return True


def is_valid_cnpj(value: str) -> bool:
    digits = _digits(value)
    if len(digits) != 14 or re.fullmatch(r"(\d)\1{13}", digits):
        return False
    first = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    for weights in (first, [6, *first]):
        total = sum(int(digits[i]) * weight for i, weight in enumerate(weights))
        remainder = total % 11
        expected = 0 if remainder < 2 else 11 - remainder
        if expected != int(digits[len(weights)]):
            return False
    return True


def normalize_brazilian_phone(value: str) -> str | None:
    """Devolve o número nacional (10 ou 11 dígitos), ou None.

    O código do país só é removido quando o comprimento indica: `5512345678`
    é um número de 10 dígitos com DDD 55, não `55` mais oito dígitos.
    """
    digits = _digits(value)
    if len(digits) in (12, 13) and digits.startswith("55"):
        digits = digits[2:]
    if len(digits) not in (10, 11):
        return None
    if not 11 <= int(digits[:2]) <= 99:
        return None
    if len(digits) == 11:
        return digits if digits[2] == "9" else None
    return digits if digits[2] in "2345" else None


def classify_pix_key(value: str) -> tuple[str, str] | None:
    """Classifica a *forma* da chave PIX. Não verifica registro em banco."""
    valor = value.strip()
    if not valor:
        return None
    if EMAIL_SHAPE.match(valor):
        return ("email", valor.lower())
    if EVP_SHAPE.match(valor):
        return ("evp", valor.lower())

    digits = _digits(valor)
    if len(digits) == 11 and is_valid_cpf(digits):
        return ("cpf", digits)
    if len(digits) == 14 and is_valid_cnpj(digits):
        return ("cnpj", digits)
    phone = normalize_brazilian_phone(valor)
    if phone:
        return ("phone", f"+55{phone}")
    return None
