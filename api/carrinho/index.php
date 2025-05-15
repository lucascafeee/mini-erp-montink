<?php
require_once __DIR__ . '/../includes/init.php';

$request = new Request();
$method = $request->getMethod();
$db = Database::getInstance();

// Inicializa a sessão
Session::start();

// Estrutura de carrinho vazio
function carrinhoVazio()
{
    return [
        'itens' => [],
        'subtotal' => 0,
        'frete' => 0,
        'desconto' => 0,
        'total' => 0,
        'cupom' => null
    ];
}

// Busca informações do produto
function buscarProduto($db, $produtoId, $variacaoId = null)
{
    // Busca o produto
    $sql = "SELECT id, nome, preco FROM produtos WHERE id = ?";
    $produto = $db->selectOne($sql, [$produtoId]);

    if (!$produto) {
        return null;
    }

    // Se tiver variação, busca a variação
    if ($variacaoId) {
        $sql = "SELECT id, nome FROM variacoes WHERE id = ? AND produto_id = ?";
        $variacao = $db->selectOne($sql, [$variacaoId, $produtoId]);

        if (!$variacao) {
            return null;
        }

        // Verifica o estoque da variação
        $sql = "SELECT quantidade FROM estoque WHERE produto_id = ? AND variacao_id = ?";
        $estoque = $db->selectOne($sql, [$produtoId, $variacaoId]);

        $produto['variacao_id'] = $variacao['id'];
        $produto['variacao'] = $variacao['nome'];
        $produto['estoque'] = $estoque ? intval($estoque['quantidade']) : 0;
    } else {
        // Verifica o estoque geral
        $sql = "SELECT quantidade FROM estoque WHERE produto_id = ? AND variacao_id IS NULL";
        $estoque = $db->selectOne($sql, [$produtoId]);

        $produto['variacao_id'] = null;
        $produto['variacao'] = null;
        $produto['estoque'] = $estoque ? intval($estoque['quantidade']) : 0;
    }

    return $produto;
}

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

// Rota: GET /api/carrinho - Obter o carrinho atual
if ($method === 'GET') {
    try {
        // Obtém o carrinho da sessão ou cria um novo
        $carrinho = Session::get('carrinho', carrinhoVazio());

        // Recalcula o carrinho (caso tenha havido mudanças nos preços)
        if (!empty($carrinho['itens'])) {
            foreach ($carrinho['itens'] as &$item) {
                $produto = buscarProduto($db, $item['produto_id'], $item['variacao_id']);
                if ($produto) {
                    $item['preco'] = $produto['preco'];
                    $item['estoque'] = $produto['estoque'];
                }
            }
            $carrinho = recalcularCarrinho($db, $carrinho);
            Session::set('carrinho', $carrinho);
        }

        Response::success($carrinho);
    } catch (Exception $e) {
        Response::internalServerError($e->getMessage());
    }
}
// Rota: POST /api/carrinho - Adicionar um item ao carrinho
else if ($method === 'POST') {
    try {
        $data = $request->all();

        if (!isset($data['produto_id'])) {
            Response::badRequest('ID do produto é obrigatório');
        }

        $produtoId = intval($data['produto_id']);
        $variacaoId = isset($data['variacao_id']) ? intval($data['variacao_id']) : null;
        $quantidade = isset($data['quantidade']) ? intval($data['quantidade']) : 1;

        if ($quantidade <= 0) {
            Response::badRequest('Quantidade deve ser maior que zero');
        }

        // Busca informações do produto
        $produto = buscarProduto($db, $produtoId, $variacaoId);

        if (!$produto) {
            Response::notFound('Produto não encontrado');
        }

        // Verifica estoque
        if ($produto['estoque'] < $quantidade) {
            Response::badRequest('Estoque insuficiente');
        }

        // Obtém o carrinho atual
        $carrinho = Session::get('carrinho', carrinhoVazio());

        // Verifica se o produto já está no carrinho
        $itemExistente = false;
        foreach ($carrinho['itens'] as &$item) {
            if ($item['produto_id'] == $produtoId && $item['variacao_id'] == $variacaoId) {
                // Verifica estoque para a nova quantidade
                $novaQuantidade = $item['quantidade'] + $quantidade;
                if ($produto['estoque'] < $novaQuantidade) {
                    Response::badRequest('Estoque insuficiente');
                }

                $item['quantidade'] = $novaQuantidade;
                $itemExistente = true;
                break;
            }
        }

        // Se o produto não estiver no carrinho, adiciona
        if (!$itemExistente) {
            $novoItem = [
                'produto_id' => $produtoId,
                'variacao_id' => $variacaoId,
                'nome' => $produto['nome'],
                'variacao' => $produto['variacao'],
                'preco' => $produto['preco'],
                'quantidade' => $quantidade
            ];

            $carrinho['itens'][] = $novoItem;
        }

        // Recalcula o carrinho
        $carrinho = recalcularCarrinho($db, $carrinho);

        // Salva o carrinho na sessão
        Session::set('carrinho', $carrinho);

        Response::success($carrinho);
    } catch (Exception $e) {
        Response::internalServerError($e->getMessage());
    }
}
// Rota: PUT /api/carrinho - Atualizar um item do carrinho
else if ($method === 'PUT') {
    try {
        $data = $request->all();

        if (!isset($data['produto_id'])) {
            Response::badRequest('ID do produto é obrigatório');
        }

        $produtoId = intval($data['produto_id']);
        $variacaoId = isset($data['variacao_id']) ? intval($data['variacao_id']) : null;
        $quantidade = isset($data['quantidade']) ? intval($data['quantidade']) : 1;

        // Obtém o carrinho atual
        $carrinho = Session::get('carrinho', carrinhoVazio());

        // Se a quantidade for zero, remove o item
        if ($quantidade <= 0) {
            $itensAtualizados = [];
            foreach ($carrinho['itens'] as $item) {
                if ($item['produto_id'] != $produtoId || $item['variacao_id'] != $variacaoId) {
                    $itensAtualizados[] = $item;
                }
            }

            $carrinho['itens'] = $itensAtualizados;
        } else {
            // Busca informações do produto para verificar estoque
            $produto = buscarProduto($db, $produtoId, $variacaoId);

            if (!$produto) {
                Response::notFound('Produto não encontrado');
            }

            // Verifica estoque
            if ($produto['estoque'] < $quantidade) {
                Response::badRequest('Estoque insuficiente');
            }

            // Atualiza quantidade
            $itemEncontrado = false;
            foreach ($carrinho['itens'] as &$item) {
                if ($item['produto_id'] == $produtoId && $item['variacao_id'] == $variacaoId) {
                    $item['quantidade'] = $quantidade;
                    $itemEncontrado = true;
                    break;
                }
            }

            if (!$itemEncontrado) {
                Response::notFound('Item não encontrado no carrinho');
            }
        }

        // Recalcula o carrinho
        $carrinho = recalcularCarrinho($db, $carrinho);

        // Salva o carrinho na sessão
        Session::set('carrinho', $carrinho);

        Response::success($carrinho);
    } catch (Exception $e) {
        Response::internalServerError($e->getMessage());
    }
}
// Rota: DELETE /api/carrinho - Limpar o carrinho
else if ($method === 'DELETE') {
    try {
        // Limpa o carrinho
        Session::set('carrinho', carrinhoVazio());

        Response::success(carrinhoVazio());
    } catch (Exception $e) {
        Response::internalServerError($e->getMessage());
    }
} else {
    Response::badRequest('Método não suportado');
}
