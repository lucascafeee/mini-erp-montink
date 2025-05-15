<?php
require_once __DIR__ . '/../includes/init.php';

$request = new Request();
$method = $request->getMethod();
$db = Database::getInstance();

// Rota: GET /api/produtos - Listar todos os produtos
if ($method === 'GET') {
    try {
        $sql = "SELECT p.id, p.nome, p.preco, 
                COALESCE(SUM(e.quantidade), 0) AS estoque
                FROM produtos p
                LEFT JOIN estoque e ON e.produto_id = p.id AND e.variacao_id IS NULL
                GROUP BY p.id, p.nome, p.preco";

        $produtos = $db->select($sql);

        // Para cada produto, busca suas variações
        foreach ($produtos as &$produto) {
            $sql = "SELECT v.id, v.nome, COALESCE(e.quantidade, 0) AS estoque
                    FROM variacoes v
                    LEFT JOIN estoque e ON e.variacao_id = v.id
                    WHERE v.produto_id = ?
                    ORDER BY v.nome";

            $variacoes = $db->select($sql, [$produto['id']]);

            if (!empty($variacoes)) {
                $produto['variacoes'] = $variacoes;
            } else {
                $produto['variacoes'] = null;
            }
        }

        Response::success($produtos);
    } catch (Exception $e) {
        Response::internalServerError($e->getMessage());
    }
}
// Rota: POST /api/produtos - Criar um novo produto
else if ($method === 'POST') {
    try {
        $data = $request->all();

        if (empty($data['nome'])) {
            Response::badRequest('Nome do produto é obrigatório');
        }

        if (!isset($data['preco']) || $data['preco'] <= 0) {
            Response::badRequest('Preço deve ser maior que zero');
        }

        $db->beginTransaction();

        // Insere o produto
        $sql = "INSERT INTO produtos (nome, preco) VALUES (?, ?)";
        $produtoId = $db->insert($sql, [
            $data['nome'],
            $data['preco']
        ]);

        // Se tem variações, insere cada uma
        if (!empty($data['variacoes']) && is_array($data['variacoes'])) {
            foreach ($data['variacoes'] as $variacao) {
                if (empty($variacao['nome'])) {
                    continue;
                }

                // Insere a variação
                $sql = "INSERT INTO variacoes (produto_id, nome) VALUES (?, ?)";
                $variacaoId = $db->insert($sql, [
                    $produtoId,
                    $variacao['nome']
                ]);

                // Insere o estoque da variação
                if (isset($variacao['estoque']) && $variacao['estoque'] > 0) {
                    $sql = "INSERT INTO estoque (produto_id, variacao_id, quantidade) VALUES (?, ?, ?)";
                    $db->insert($sql, [
                        $produtoId,
                        $variacaoId,
                        $variacao['estoque']
                    ]);
                }
            }
        }
        // Se não tem variações e tem estoque, insere o estoque geral
        else if (isset($data['estoque']) && $data['estoque'] > 0) {
            $sql = "INSERT INTO estoque (produto_id, quantidade) VALUES (?, ?)";
            $db->insert($sql, [
                $produtoId,
                $data['estoque']
            ]);
        }

        $db->commit();

        // Busca o produto recém-criado
        $sql = "SELECT id, nome, preco FROM produtos WHERE id = ?";
        $produto = $db->selectOne($sql, [$produtoId]);

        Response::success($produto, 201);
    } catch (Exception $e) {
        $db->rollBack();
        Response::internalServerError($e->getMessage());
    }
} else {
    Response::badRequest('Método não suportado');
}
