# MyCEP — Ruby / Rails.
#
#   MYCEP_API_KEY=cep_live_... ruby my_cep.rb 01001000
#
# Em Rails, coloque em app/services/my_cep.rb e leia a chave de
# Rails.application.credentials.mycep_api_key.
require "net/http"
require "json"

class MyCep
  class Error < StandardError
    attr_reader :status, :code

    def initialize(status, code, message)
      @status = status
      @code = code
      super(message)
    end
  end

  BASE = URI(ENV.fetch("MYCEP_BASE", "https://api.mycep.app.br")).freeze

  def self.buscar_cep(cep)
    digitos = cep.to_s.gsub(/\D/, "")
    raise Error.new(400, "invalid_cep", "CEP precisa de 8 dígitos.") unless digitos.length == 8

    uri = URI.join(BASE, "/api/v1/search/cep/#{digitos}")
    request = Net::HTTP::Get.new(uri)
    request["Accept"] = "application/json"

    chave = ENV["MYCEP_API_KEY"]
    request["Authorization"] = "Bearer #{chave}" if chave && !chave.empty?

    resposta = Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == "https", read_timeout: 10) do |http|
      http.request(request)
    end

    corpo = begin
      JSON.parse(resposta.body)
    rescue JSON::ParserError
      {}
    end

    unless resposta.is_a?(Net::HTTPSuccess)
      raise Error.new(
        resposta.code.to_i,
        corpo["error"] || "request_failed",
        corpo["message"] || "Falha na consulta."
      )
    end

    corpo
  end
end

if $PROGRAM_NAME == __FILE__
  begin
    endereco = MyCep.buscar_cep(ARGV[0] || "01001000")
    puts "#{endereco['logradouro']} — #{endereco['cidade']}/#{endereco['uf']}"
  rescue MyCep::Error => erro
    warn "[#{erro.code}] #{erro.message}"
    exit 1
  end
end
