// MyCEP — C# / .NET 8.
//   MYCEP_API_KEY=cep_live_... dotnet run -- 01001000
using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.RegularExpressions;

var baseUrl = Environment.GetEnvironmentVariable("MYCEP_BASE") ?? "https://api.mycep.app.br";
var cep = args.Length > 0 ? args[0] : "01001000";

try
{
    var endereco = await BuscarCepAsync(cep);
    Console.WriteLine($"{endereco.Logradouro} — {endereco.Cidade}/{endereco.Uf}");
}
catch (MyCepException erro)
{
    Console.Error.WriteLine($"[{erro.Code}] {erro.Message}");
    Environment.Exit(1);
}

async Task<Endereco> BuscarCepAsync(string entrada)
{
    var digitos = Regex.Replace(entrada, @"\D", "");
    if (digitos.Length != 8)
    {
        throw new MyCepException(400, "invalid_cep", "CEP precisa de 8 dígitos.");
    }

    using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };
    using var request = new HttpRequestMessage(HttpMethod.Get, $"{baseUrl}/api/v1/search/cep/{digitos}");
    request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

    var chave = Environment.GetEnvironmentVariable("MYCEP_API_KEY");
    if (!string.IsNullOrWhiteSpace(chave))
    {
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", chave);
    }

    using var response = await http.SendAsync(request);
    var corpo = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        var falha = TryParse<ApiError>(corpo);
        throw new MyCepException((int)response.StatusCode, falha?.Error ?? "request_failed",
            falha?.Message ?? "Falha na consulta.");
    }

    return TryParse<Endereco>(corpo)
        ?? throw new MyCepException(502, "invalid_response", "Resposta inesperada.");
}

static T? TryParse<T>(string json)
{
    try
    {
        return JsonSerializer.Deserialize<T>(json,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
    }
    catch (JsonException)
    {
        return default;
    }
}

record Endereco(string Cep, string Logradouro, string? Bairro, string Cidade, string Uf, string Ibge);
record ApiError(string? Error, string? Message);

class MyCepException(int status, string code, string message) : Exception(message)
{
    public int Status { get; } = status;
    public string Code { get; } = code;
}
