// MyCEP — Go 1.21+.
//
//	MYCEP_API_KEY=cep_live_... go run main.go 01001000
package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"regexp"
	"time"
)

type Endereco struct {
	Cep        string  `json:"cep"`
	Logradouro string  `json:"logradouro"`
	Bairro     string  `json:"bairro"`
	Cidade     string  `json:"cidade"`
	UF         string  `json:"uf"`
	IBGE       string  `json:"ibge"`
	Latitude   float64 `json:"latitude,omitempty"`
	Longitude  float64 `json:"longitude,omitempty"`
}

type MyCepError struct {
	Status  int
	Code    string `json:"error"`
	Message string `json:"message"`
}

func (e *MyCepError) Error() string { return fmt.Sprintf("[%s] %s", e.Code, e.Message) }

var apenasDigitos = regexp.MustCompile(`\D`)

func BuscarCEP(cep string) (*Endereco, error) {
	base := os.Getenv("MYCEP_BASE")
	if base == "" {
		base = "https://api.mycep.app.br"
	}
	digitos := apenasDigitos.ReplaceAllString(cep, "")
	if len(digitos) != 8 {
		return nil, &MyCepError{Status: 400, Code: "invalid_cep", Message: "CEP precisa de 8 dígitos."}
	}

	req, err := http.NewRequest(http.MethodGet, base+"/api/v1/search/cep/"+digitos, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/json")
	if chave := os.Getenv("MYCEP_API_KEY"); chave != "" {
		req.Header.Set("Authorization", "Bearer "+chave)
	}

	resp, err := (&http.Client{Timeout: 10 * time.Second}).Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		apiErr := &MyCepError{Status: resp.StatusCode, Code: "request_failed", Message: "Falha na consulta."}
		_ = json.NewDecoder(resp.Body).Decode(apiErr)
		return nil, apiErr
	}

	var endereco Endereco
	if err := json.NewDecoder(resp.Body).Decode(&endereco); err != nil {
		return nil, err
	}
	return &endereco, nil
}

func main() {
	cep := "01001000"
	if len(os.Args) > 1 {
		cep = os.Args[1]
	}
	endereco, err := BuscarCEP(cep)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	fmt.Printf("%s — %s/%s\n", endereco.Logradouro, endereco.Cidade, endereco.UF)
}
