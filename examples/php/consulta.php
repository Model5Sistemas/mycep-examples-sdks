<?php
/**
 * MyCEP — PHP 8+.
 *   MYCEP_API_KEY=cep_live_... php consulta.php 01001000
 */
declare(strict_types=1);

final class MyCepError extends RuntimeException
{
    // `code` não pode ser promovido: Exception já declara $code (int).
    public function __construct(
        public readonly int $status,
        public readonly string $errorCode,
        string $message
    ) {
        parent::__construct($message);
    }
}

function buscarCep(string $cep): array
{
    $base = getenv('MYCEP_BASE') ?: 'https://api.mycep.app.br';
    $digitos = preg_replace('/\D/', '', $cep);

    if (strlen($digitos) !== 8) {
        throw new MyCepError(400, 'invalid_cep', 'CEP precisa de 8 dígitos.');
    }

    $headers = ['Accept: application/json'];
    if ($chave = getenv('MYCEP_API_KEY')) {
        $headers[] = 'Authorization: Bearer ' . $chave;
    }

    $ch = curl_init("{$base}/api/v1/search/cep/{$digitos}");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 10,
        CURLOPT_HTTPHEADER     => $headers,
    ]);

    $corpo = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);

    $dados = json_decode((string) $corpo, true) ?: [];

    if ($status !== 200) {
        throw new MyCepError(
            $status,
            $dados['error'] ?? 'request_failed',
            $dados['message'] ?? 'Falha na consulta.'
        );
    }
    return $dados;
}

try {
    $endereco = buscarCep($argv[1] ?? '01001000');
    printf("%s — %s/%s\n", $endereco['logradouro'], $endereco['cidade'], $endereco['uf']);
} catch (MyCepError $erro) {
    fwrite(STDERR, "[{$erro->errorCode}] {$erro->getMessage()}\n");
    exit(1);
}
