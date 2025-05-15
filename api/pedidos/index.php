<?php
require_once __DIR__ . '/../includes/init.php';

$request = new Request();
$method = $request->getMethod();
$db = Database::getInstance();

// Inicializa a sessão
Session::start();

// Rota: GET /api/pedidos - Listar todos os pedidos
if ($method === 'GET') {
    try {
        // Busca todos os pedidos ordenados por data de criação decrescente
        $sql = "SELECT id, cliente_nome, cliente_email, cliente_cep, 
                cliente_endereco, cliente_cidade, cliente_estado, 
                subtotal, frete, desconto, total, cupom_id, status, 
                created_at 
                FROM pedidos 
                ORDER BY created_at DESC";

        $pedidos = $db->select($sql);

        // Para cada pedido, busca seus itens
        foreach ($pedidos as &$pedido) {
            $sql = "SELECT 
                    i.id, i.produto_id, p.nome, i.variacao_id, 
                    v.nome as variacao, i.quantidade, i.preco_unitario, 
                    (i.quantidade * i.preco_unitario) as subtotal 
                    FROM pedido_itens i
                    JOIN produtos p ON p.id = i.produto_id
                    LEFT JOIN variacoes v ON v.id = i.variacao_id
                    WHERE i.pedido_id = ?";

            $itens = $db->select($sql, [$pedido['id']]);
            $pedido['itens'] = $itens;
        }

        Response::success($pedidos);
    } catch (Exception $e) {
        Response::internalServerError($e->getMessage());
    }
}
// Rota: POST /api/pedidos - Criar um novo pedido
else if ($method === 'POST') {
    try {
        $data = $request->all();

        // Validações básicas
        $requiredFields = [
            'cliente_nome',
            'cliente_email',
            'cliente_cep',
            'cliente_endereco',
            'cliente_cidade',
            'cliente_estado'
        ];

        foreach ($requiredFields as $field) {
            if (empty($data[$field])) {
                Response::badRequest("Campo {$field} é obrigatório");
            }
        }

        // Obtém o carrinho
        $carrinho = Session::get('carrinho', [
            'itens' => [],
            'subtotal' => 0,
            'frete' => 0,
            'desconto' => 0,
            'total' => 0,
            'cupom' => null
        ]);

        // Verifica se o carrinho está vazio
        if (empty($carrinho['itens'])) {
            Response::badRequest('O carrinho está vazio');
        }

        // Inicia a transação
        $db->beginTransaction();

        // Insere o pedido
        $sql = "INSERT INTO pedidos (
                cliente_nome, cliente_email, cliente_cep, cliente_endereco, 
                cliente_cidade, cliente_estado, subtotal, frete, desconto, 
                total, cupom_id, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        $cupomId = $carrinho['cupom'] ? $carrinho['cupom']['id'] : null;

        $pedidoId = $db->insert($sql, [
            $data['cliente_nome'],
            $data['cliente_email'],
            $data['cliente_cep'],
            $data['cliente_endereco'],
            $data['cliente_cidade'],
            $data['cliente_estado'],
            $carrinho['subtotal'],
            $carrinho['frete'],
            $carrinho['desconto'],
            $carrinho['total'],
            $cupomId,
            'pendente'
        ]);

        // Insere os itens do pedido e atualiza o estoque
        foreach ($carrinho['itens'] as $item) {
            // Insere o item
            $sql = "INSERT INTO pedido_itens (
                    pedido_id, produto_id, variacao_id, quantidade, preco_unitario
                    ) VALUES (?, ?, ?, ?, ?)";

            $db->insert($sql, [
                $pedidoId,
                $item['produto_id'],
                $item['variacao_id'],
                $item['quantidade'],
                $item['preco']
            ]);

            // Atualiza o estoque
            if ($item['variacao_id']) {
                $sql = "UPDATE estoque SET quantidade = quantidade - ? 
                        WHERE produto_id = ? AND variacao_id = ?";
                $db->update($sql, [$item['quantidade'], $item['produto_id'], $item['variacao_id']]);
            } else {
                $sql = "UPDATE estoque SET quantidade = quantidade - ? 
                        WHERE produto_id = ? AND variacao_id IS NULL";
                $db->update($sql, [$item['quantidade'], $item['produto_id']]);
            }
        }

        $db->commit();

        // Limpa o carrinho
        Session::set('carrinho', [
            'itens' => [],
            'subtotal' => 0,
            'frete' => 0,
            'desconto' => 0,
            'total' => 0,
            'cupom' => null
        ]);

        // Envio de e-mail (simulado)
        // Em um ambiente real, aqui seria inserido o código para enviar 
        // um e-mail de confirmação para o cliente

        Response::success([
            'pedido_id' => $pedidoId,
            'message' => 'Pedido criado com sucesso'
        ], 201);
    } catch (Exception $e) {
        $db->rollBack();
        Response::internalServerError($e->getMessage());
    }
} else {
    Response::badRequest('Método não suportado');
}
