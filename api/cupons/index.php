<?php
require_once __DIR__ . '/../includes/init.php';

$request = new Request();
$method = $request->getMethod();
$db = Database::getInstance();

// Rota: GET /api/cupons - Listar todos os cupons
if ($method === 'GET') {
    try {
        $sql = "SELECT id, codigo, desconto, valor_minimo, 
                data_inicio, data_fim, is_ativo 
                FROM cupons
                ORDER BY data_inicio DESC";

        $cupons = $db->select($sql);

        Response::success($cupons);
    } catch (Exception $e) {
        Response::internalServerError($e->getMessage());
    }
}
// Rota: POST /api/cupons - Criar um novo cupom
else if ($method === 'POST') {
    try {
        $data = $request->all();

        // Validações
        if (empty($data['codigo'])) {
            Response::badRequest('Código do cupom é obrigatório');
        }

        if (!isset($data['desconto']) || $data['desconto'] <= 0) {
            Response::badRequest('Valor do desconto deve ser maior que zero');
        }

        if (empty($data['data_inicio']) || empty($data['data_fim'])) {
            Response::badRequest('Datas de início e fim são obrigatórias');
        }

        // Verifica se o código já existe
        $sql = "SELECT id FROM cupons WHERE codigo = ?";
        $cupomExistente = $db->selectOne($sql, [$data['codigo']]);

        if ($cupomExistente) {
            Response::badRequest('Código de cupom já existe');
        }

        // Prepara os dados
        $valorMinimo = isset($data['valor_minimo']) ? $data['valor_minimo'] : 0;
        $isAtivo = isset($data['is_ativo']) ? (bool)$data['is_ativo'] : true;

        // Insere o cupom
        $sql = "INSERT INTO cupons (codigo, desconto, valor_minimo, data_inicio, data_fim, is_ativo) 
                VALUES (?, ?, ?, ?, ?, ?)";

        $cupomId = $db->insert($sql, [
            $data['codigo'],
            $data['desconto'],
            $valorMinimo,
            $data['data_inicio'],
            $data['data_fim'],
            $isAtivo ? 1 : 0
        ]);

        // Busca o cupom recém-criado
        $sql = "SELECT id, codigo, desconto, valor_minimo, data_inicio, data_fim, is_ativo 
                FROM cupons WHERE id = ?";
        $cupom = $db->selectOne($sql, [$cupomId]);

        Response::success($cupom, 201);
    } catch (Exception $e) {
        Response::internalServerError($e->getMessage());
    }
} else {
    Response::badRequest('Método não suportado');
}
