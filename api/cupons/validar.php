<?php
require_once __DIR__ . '/../includes/init.php';

$request = new Request();
$method = $request->getMethod();
$db = Database::getInstance();

// Rota: POST /api/cupons/validar - Validar um cupom
if ($method === 'POST') {
    try {
        $data = $request->all();

        if (empty($data['codigo'])) {
            Response::badRequest('Código do cupom é obrigatório');
        }

        // Valor total opcional (para validar valor mínimo)
        $valorTotal = isset($data['valor_total']) ? floatval($data['valor_total']) : 0;

        // Busca o cupom
        $sql = "SELECT id, codigo, desconto, valor_minimo, data_inicio, data_fim, is_ativo 
                FROM cupons 
                WHERE codigo = ?";

        $cupom = $db->selectOne($sql, [$data['codigo']]);

        if (!$cupom) {
            Response::error('Cupom não encontrado', 404);
        }

        // Verifica se está ativo
        if (!$cupom['is_ativo']) {
            Response::error('Cupom inativo', 400);
        }

        // Verifica se está dentro do período de validade
        $hoje = date('Y-m-d');
        if ($hoje < $cupom['data_inicio'] || $hoje > $cupom['data_fim']) {
            Response::error('Cupom fora do período de validade', 400);
        }

        // Verifica valor mínimo
        if ($valorTotal > 0 && $cupom['valor_minimo'] > 0 && $valorTotal < $cupom['valor_minimo']) {
            Response::error('Valor mínimo para uso do cupom é de R$ ' . number_format($cupom['valor_minimo'], 2, ',', '.'), 400);
        }

        // Retorna o cupom válido
        Response::success($cupom);
    } catch (Exception $e) {
        Response::internalServerError($e->getMessage());
    }
} else {
    Response::badRequest('Método não suportado');
}
