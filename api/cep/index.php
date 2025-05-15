<?php
require_once __DIR__ . '/../includes/init.php';

$request = new Request();
$method = $request->getMethod();

// Rota: GET /api/cep - Consultar um CEP
if ($method === 'GET') {
    try {
        $cep = $request->getQueryParam('cep');

        if (empty($cep)) {
            Response::badRequest('CEP é obrigatório');
        }

        // Remove caracteres não numéricos
        $cep = preg_replace('/\D/', '', $cep);

        if (strlen($cep) !== 8) {
            Response::badRequest('CEP inválido');
        }

        // Consulta API do ViaCEP
        $url = "https://viacep.com.br/ws/{$cep}/json/";
        $ch = curl_init($url);

        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

        $response = curl_exec($ch);
        $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        curl_close($ch);

        if ($statusCode !== 200) {
            Response::error('Erro ao consultar CEP', 500);
        }

        $endereco = json_decode($response, true);

        if (isset($endereco['erro']) && $endereco['erro'] === true) {
            Response::error('CEP não encontrado', 404);
        }

        Response::success($endereco);
    } catch (Exception $e) {
        Response::internalServerError($e->getMessage());
    }
} else {
    Response::badRequest('Método não suportado');
}
