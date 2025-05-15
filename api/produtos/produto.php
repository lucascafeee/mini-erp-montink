<?php
require_once __DIR__ . '/../includes/init.php';

$request = new Request();
$method = $request->getMethod();
$db = Database::getInstance();

// Obtém o ID do produto da URL
$segments = $request->getSegments();
$produtoId = isset($segments[2]) ? intval($segments[2]) : 0;

if ($produtoId <= 0) {
    Response::badRequest('ID do produto inválido');
}

// Rota: GET /api/produtos/{id} - Obter detalhes de um produto
if ($method === 'GET') {
    try {
        $sql = "SELECT id, nome, preco FROM produtos WHERE id = ?";
        $produto = $db->selectOne($sql, [$produtoId]);

        if (!$produto) {
            Response::notFound('Produto não encontrado');
        }

        // Busca o estoque do produto (sem variação)
        $sql = "SELECT SUM(quantidade) as estoque 
                FROM estoque 
                WHERE produto_id = ? AND variacao_id IS NULL";
        $estoque = $db->selectOne($sql, [$produtoId]);

        $produto['estoque'] = $estoque ? intval($estoque['estoque']) : 0;

        // Busca as variações do produto
        $sql = "SELECT v.id, v.nome, COALESCE(e.quantidade, 0) AS estoque
                FROM variacoes v
                LEFT JOIN estoque e ON e.variacao_id = v.id
                WHERE v.produto_id = ?
                ORDER BY v.nome";

        $variacoes = $db->select($sql, [$produtoId]);

        if (!empty($variacoes)) {
            $produto['variacoes'] = $variacoes;
        } else {
            $produto['variacoes'] = [];
        }

        Response::success($produto);
    } catch (Exception $e) {
        Response::internalServerError($e->getMessage());
    }
}
// Rota: PUT /api/produtos/{id} - Atualizar um produto
else if ($method === 'PUT') {
    try {
        $data = $request->all();

        if (empty($data)) {
            Response::badRequest('Dados não fornecidos');
        }

        // Verifica se o produto existe
        $sql = "SELECT id FROM produtos WHERE id = ?";
        $produto = $db->selectOne($sql, [$produtoId]);

        if (!$produto) {
            Response::notFound('Produto não encontrado');
        }

        $db->beginTransaction();

        // Atualiza os dados básicos do produto
        if (isset($data['nome']) || isset($data['preco'])) {
            $updateFields = [];
            $updateParams = [];

            if (isset($data['nome']) && !empty($data['nome'])) {
                $updateFields[] = "nome = ?";
                $updateParams[] = $data['nome'];
            }

            if (isset($data['preco'])) {
                $updateFields[] = "preco = ?";
                $updateParams[] = $data['preco'];
            }

            if (!empty($updateFields)) {
                $updateParams[] = $produtoId;
                $sql = "UPDATE produtos SET " . implode(", ", $updateFields) . " WHERE id = ?";
                $db->update($sql, $updateParams);
            }
        }

        // Atualiza estoque (se não houver variações)
        if (isset($data['estoque']) && !isset($data['variacoes'])) {
            // Verifica se já existe um registro de estoque para o produto
            $sql = "SELECT id FROM estoque WHERE produto_id = ? AND variacao_id IS NULL";
            $estoqueExistente = $db->selectOne($sql, [$produtoId]);

            if ($estoqueExistente) {
                $sql = "UPDATE estoque SET quantidade = ? WHERE produto_id = ? AND variacao_id IS NULL";
                $db->update($sql, [$data['estoque'], $produtoId]);
            } else {
                $sql = "INSERT INTO estoque (produto_id, quantidade) VALUES (?, ?)";
                $db->insert($sql, [$produtoId, $data['estoque']]);
            }
        }

        // Atualiza variações (se fornecido)
        if (isset($data['variacoes']) && is_array($data['variacoes'])) {
            // Lista de IDs de variações existentes
            $sql = "SELECT id FROM variacoes WHERE produto_id = ?";
            $variacoesExistentes = $db->select($sql, [$produtoId]);
            $variacoesIds = array_column($variacoesExistentes, 'id');

            // Processa cada variação
            foreach ($data['variacoes'] as $variacao) {
                // Caso seja uma atualização de variação existente
                if (isset($variacao['id']) && in_array($variacao['id'], $variacoesIds)) {
                    $variacaoId = $variacao['id'];

                    // Atualiza o nome da variação
                    if (isset($variacao['nome']) && !empty($variacao['nome'])) {
                        $sql = "UPDATE variacoes SET nome = ? WHERE id = ?";
                        $db->update($sql, [$variacao['nome'], $variacaoId]);
                    }

                    // Atualiza o estoque da variação
                    if (isset($variacao['estoque'])) {
                        // Verifica se já existe um registro de estoque para a variação
                        $sql = "SELECT id FROM estoque WHERE produto_id = ? AND variacao_id = ?";
                        $estoqueExistente = $db->selectOne($sql, [$produtoId, $variacaoId]);

                        if ($estoqueExistente) {
                            $sql = "UPDATE estoque SET quantidade = ? WHERE produto_id = ? AND variacao_id = ?";
                            $db->update($sql, [$variacao['estoque'], $produtoId, $variacaoId]);
                        } else {
                            $sql = "INSERT INTO estoque (produto_id, variacao_id, quantidade) VALUES (?, ?, ?)";
                            $db->insert($sql, [$produtoId, $variacaoId, $variacao['estoque']]);
                        }
                    }
                }
                // Caso seja uma nova variação
                else if (!isset($variacao['id']) && isset($variacao['nome']) && !empty($variacao['nome'])) {
                    // Insere a nova variação
                    $sql = "INSERT INTO variacoes (produto_id, nome) VALUES (?, ?)";
                    $novoVariacaoId = $db->insert($sql, [$produtoId, $variacao['nome']]);

                    // Insere o estoque da nova variação
                    if (isset($variacao['estoque']) && $variacao['estoque'] > 0) {
                        $sql = "INSERT INTO estoque (produto_id, variacao_id, quantidade) VALUES (?, ?, ?)";
                        $db->insert($sql, [$produtoId, $novoVariacaoId, $variacao['estoque']]);
                    }
                }
            }
        }

        $db->commit();

        // Busca o produto atualizado
        $sql = "SELECT id, nome, preco FROM produtos WHERE id = ?";
        $produtoAtualizado = $db->selectOne($sql, [$produtoId]);

        Response::success($produtoAtualizado);
    } catch (Exception $e) {
        $db->rollBack();
        Response::internalServerError($e->getMessage());
    }
}
// Rota: DELETE /api/produtos/{id} - Excluir um produto
else if ($method === 'DELETE') {
    try {
        // Verifica se o produto existe
        $sql = "SELECT id FROM produtos WHERE id = ?";
        $produto = $db->selectOne($sql, [$produtoId]);

        if (!$produto) {
            Response::notFound('Produto não encontrado');
        }

        $db->beginTransaction();

        // Exclui o estoque
        $sql = "DELETE FROM estoque WHERE produto_id = ?";
        $db->delete($sql, [$produtoId]);

        // Exclui as variações
        $sql = "DELETE FROM variacoes WHERE produto_id = ?";
        $db->delete($sql, [$produtoId]);

        // Exclui o produto
        $sql = "DELETE FROM produtos WHERE id = ?";
        $db->delete($sql, [$produtoId]);

        $db->commit();

        Response::success(['message' => 'Produto excluído com sucesso']);
    } catch (Exception $e) {
        $db->rollBack();
        Response::internalServerError($e->getMessage());
    }
} else {
    Response::badRequest('Método não suportado');
}
