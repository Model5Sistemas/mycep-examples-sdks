"""Os validadores são puros — dá para testá-los sem rede."""
from mycep import classify_pix_key, is_valid_cep, is_valid_cnpj, is_valid_cpf
from mycep.validators import normalize_brazilian_phone


def test_cep():
    assert is_valid_cep("01001-000")
    assert is_valid_cep("01001000")
    assert not is_valid_cep("0100100")


def test_cpf():
    assert is_valid_cpf("529.982.247-25")
    assert not is_valid_cpf("529.982.247-24")
    # Repdigits passam na aritmética, mas nunca são emitidos.
    assert not is_valid_cpf("11111111111")


def test_cnpj():
    assert is_valid_cnpj("11.222.333/0001-81")
    assert not is_valid_cnpj("11222333000182")
    assert not is_valid_cnpj("00000000000000")


def test_phone_ddd_55_nao_e_codigo_de_pais():
    # 55 é o DDD de Santa Maria/RS; remover quebraria o número.
    assert normalize_brazilian_phone("5532123456") == "5532123456"
    assert normalize_brazilian_phone("+55 11 98765-4321") == "11987654321"
    assert normalize_brazilian_phone("987654321") is None


def test_pix():
    assert classify_pix_key("financeiro@exemplo.com.br")[0] == "email"
    assert classify_pix_key("123e4567-e89b-12d3-a456-426614174000")[0] == "evp"
    assert classify_pix_key("529.982.247-25")[0] == "cpf"
    assert classify_pix_key("chave qualquer") is None
