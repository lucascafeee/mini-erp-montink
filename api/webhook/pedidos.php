<?php
require_once __DIR__ . '/../includes/init.php';

$request = new Request();
$method = $request->getMethod();
$db = Database::getInstance();

// Rota: POST /api/webhook/pedidos - Atualizar o status de um pedido
if ($method === 'POST') {
    try {
        $data = $request->all();

        if (!isset($data['pedido_id']) || !isset($data['status'])) {
            Response::badRequest('Pedido ID e status são obrigatórios');
        }

        $pedidoId = intval($data['pedido_id']);
        $status = $data['status'];

        // Validar o status
        $statusesValidos = ['pendente', 'pago', 'enviado', 'entregue', 'cancelado'];
        if (!in_array($status, $statusesValidos)) {
            Response::badRequest('Status inválido');
        }

        // Verifica se o pedido existe
        $sql = "SELECT id, status FROM pedidos WHERE id = ?";
        $pedido = $db->selectOne($sql, [$pedidoId]);

        if (!$pedido) {
            Response::notFound('Pedido não encontrado');
        }

        // Se o pedido estiver sendo cancelado, devolve os itens ao estoque
        if ($status === 'cancelado' && $pedido['status'] !== 'cancelado') {
            $db->beginTransaction();

            // Busca os itens do pedido
            $sql = "SELECT produto_id, variacao_id, quantidade FROM pedido_itens WHERE pedido_id = ?";
            $itens = $db->select($sql, [$pedidoId]);

            // Devolve o estoque para cada item
            foreach ($itens as $item) {
                if ($item['variacao_id']) {
                    $sql = "UPDATE estoque SET quantidade = quantidade + ? 
                            WHERE produto_id = ? AND variacao_id = ?";
                    $db->update($sql, [$item['quantidade'], $item['produto_id'], $item['variacao_id']]);
                } else {
                    $sql = "UPDATE estoque SET quantidade = quantidade + ? 
                            WHERE produto_id = ? AND variacao_id IS NULL";
                    $db->update($sql, [$item['quantidade'], $item['produto_id']]);
                }
            }

            // Atualiza o status do pedido
            $sql = "UPDATE pedidos SET status = ? WHERE id = ?";
            $db->update($sql, [$status, $pedidoId]);

            $db->commit();
        } else {
            // Apenas atualiza o status
            $sql = "UPDATE pedidos SET status = ? WHERE id = ?";
            $db->update($sql, [$status, $pedidoId]);
        }

        // Envio de e-mail (simulado)
        // Em um ambiente real, aqui seria inserido o código para enviar um e-mail 
        // de atualização de status para o cliente

        Response::success([
            'pedido_id' => $pedidoId,
            'status' => $status,
            'message' => 'Status do pedido atualizado com sucesso'
        ]);
    } catch (Exception $e) {
        try {
            // Tenta dar rollback apenas se uma transação estiver ativa
            $db->rollBack();
        } catch (Exception $ex) {
            // Ignora erro caso não exista transação ativa
        }
        Response::internalServerError($e->getMessage());
    }
} else {
    Response::badRequest('Método não suportado');
}
