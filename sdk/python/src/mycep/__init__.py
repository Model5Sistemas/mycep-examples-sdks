"""Cliente oficial da API MyCEP.

    from mycep import MyCepClient

    mycep = MyCepClient(api_key="cep_live_...")
    endereco = mycep.lookup_cep("01001-000")
"""

from .client import MyCepClient, MyCepError
from .validators import (
    classify_pix_key,
    is_valid_cep,
    is_valid_cnpj,
    is_valid_cpf,
    normalize_brazilian_phone,
)

__all__ = [
    "MyCepClient",
    "MyCepError",
    "classify_pix_key",
    "is_valid_cep",
    "is_valid_cnpj",
    "is_valid_cpf",
    "normalize_brazilian_phone",
]
__version__ = "0.1.0"
