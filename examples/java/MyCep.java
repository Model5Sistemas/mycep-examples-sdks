// MyCEP — Java 17+.
//   MYCEP_API_KEY=cep_live_... java MyCep.java 01001000
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

public class MyCep {
    private static final String BASE =
            System.getenv().getOrDefault("MYCEP_BASE", "https://api.mycep.app.br");

    /** Erro da API com o código estável em `error`. */
    public static class MyCepException extends RuntimeException {
        public final int status;
        public final String code;

        public MyCepException(int status, String code, String message) {
            super(message);
            this.status = status;
            this.code = code;
        }
    }

    public static String buscarCep(String cep) throws Exception {
        String digitos = cep.replaceAll("\\D", "");
        if (digitos.length() != 8) {
            throw new MyCepException(400, "invalid_cep", "CEP precisa de 8 dígitos.");
        }

        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(BASE + "/api/v1/search/cep/" + digitos))
                .header("Accept", "application/json")
                .timeout(Duration.ofSeconds(10))
                .GET();

        String chave = System.getenv("MYCEP_API_KEY");
        if (chave != null && !chave.isBlank()) {
            builder.header("Authorization", "Bearer " + chave);
        }

        HttpResponse<String> resposta = HttpClient.newHttpClient()
                .send(builder.build(), HttpResponse.BodyHandlers.ofString());

        if (resposta.statusCode() != 200) {
            throw new MyCepException(resposta.statusCode(), "request_failed", resposta.body());
        }
        return resposta.body();
    }

    public static void main(String[] args) throws Exception {
        String cep = args.length > 0 ? args[0] : "01001000";
        try {
            System.out.println(buscarCep(cep));
        } catch (MyCepException erro) {
            System.err.printf("[%s] %s%n", erro.code, erro.getMessage());
            System.exit(1);
        }
    }
}
