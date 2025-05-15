<?php
require_once __DIR__ . '/../includes/init.php';

$request = new Request();
$method = $request->getMethod();
$db = Database::getInstance();

// Inicializa a sessão
Session::start();

// Recalcula o carrinho
function recalcularCarrinho($db, $carrinho)
{
    // Calcula subtotal
    $subtotal = 0;
    foreach ($carrinho['itens'] as $item) {
        $subtotal += $item['preco'] * $item['quantidade'];
    }

    $carrinho['subtotal'] = $subtotal;

    // Calcula frete com as regras exatas conforme requisito:
    // - Entre R$52,00 e R$166,59: frete R$15,00
    // - Acima de R$200,00: frete grátis
    // - Outros valores: frete R$20,00
    if ($subtotal > 200) {
        $carrinho['frete'] = 0; // Frete grátis
    } elseif ($subtotal >= 52 && $subtotal <= 166.59) {
        $carrinho['frete'] = 15; // Frete R$15
    } else {
        $carrinho['frete'] = 20; // Frete R$20
    }

    // Calcula desconto (se houver cupom)
    $desconto = 0;
    if ($carrinho['cupom']) {
        $desconto = min($carrinho['cupom']['desconto'], $subtotal);
    }
    $carrinho['desconto'] = $desconto;

    // Calcula total
    $carrinho['total'] = $subtotal + $carrinho['frete'] - $desconto;

    return $carrinho;
}

// Rota: POST /api/carrinho/aplicar-cupom - Aplicar um cupom ao carrinho
if ($method === 'POST') {
    try {
        $data = $request->all();

        if (empty($data['codigo'])) {
            Response::badRequest('Código do cupom é obrigatório');
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
        if ($carrinho['subtotal'] < $cupom['valor_minimo']) {
            Response::error(
                'Valor mínimo para uso do cupom é de R$ ' .
                    number_format($cupom['valor_minimo'], 2, ',', '.'),
                400
            );
        }

        // Aplica o cupom
        $carrinho['cupom'] = [
            'id' => $cupom['id'],
            'codigo' => $cupom['codigo'],
            'desconto' => $cupom['desconto']
        ];

        // Recalcula o carrinho
        $carrinho = recalcularCarrinho($db, $carrinho);

        // Salva o carrinho na sessão
        Session::set('carrinho', $carrinho);

        Response::success($carrinho);
    } catch (Exception $e) {
        Response::internalServerError($e->getMessage());
    }
}
// Rota: DELETE /api/carrinho/aplicar-cupom - Remover o cupom do carrinho
else if ($method === 'DELETE') {
    try {
        // Obtém o carrinho
        $carrinho = Session::get('carrinho', [
            'itens' => [],
            'subtotal' => 0,
            'frete' => 0,
            'desconto' => 0,
            'total' => 0,
            'cupom' => null
        ]);

        // Remove o cupom
        $carrinho['cupom'] = null;
        $carrinho['desconto'] = 0;

        // Recalcula o carrinho
        $carrinho = recalcularCarrinho($db, $carrinho);

        // Salva o carrinho na sessão
        Session::set('carrinho', $carrinho);

        Response::success($carrinho);
    } catch (Exception $e) {
        Response::internalServerError($e->getMessage());
    }
} else {
    Response::badRequest('Método não suportado');
}
