<?php
require_once __DIR__ . '/includes/init.php';

$request = new Request();
$path = $request->getPath();
$segments = $request->getSegments();

// Remove o prefixo 'api' do caminho
if (!empty($segments) && $segments[0] === 'api') {
    array_shift($segments);
}

// Roteamento da API baseado no caminho
if (empty($segments)) {
    // Rota raiz: /api
    Response::success([
        'message' => 'API do Mini ERP',
        'version' => '1.0.0'
    ]);
} else {
    $resource = $segments[0];

    // Primeiro nível de recursos
    switch ($resource) {
        case 'produtos':
            if (count($segments) >= 2 && is_numeric($segments[1])) {
                // Rota: /api/produtos/{id}
                require_once __DIR__ . '/produtos/produto.php';
            } else {
                // Rota: /api/produtos
                require_once __DIR__ . '/produtos/index.php';
            }
            break;

        case 'cupons':
            if (count($segments) >= 2 && $segments[1] === 'validar') {
                // Rota: /api/cupons/validar
                require_once __DIR__ . '/cupons/validar.php';
            } else {
                // Rota: /api/cupons
                require_once __DIR__ . '/cupons/index.php';
            }
            break;

        case 'carrinho':
            if (count($segments) >= 2 && $segments[1] === 'aplicar-cupom') {
                // Rota: /api/carrinho/aplicar-cupom
                require_once __DIR__ . '/carrinho/aplicar-cupom.php';
            } else {
                // Rota: /api/carrinho
                require_once __DIR__ . '/carrinho/index.php';
            }
            break;

        case 'pedidos':
            // Rota: /api/pedidos
            require_once __DIR__ . '/pedidos/index.php';
            break;

        case 'cep':
            // Rota: /api/cep
            require_once __DIR__ . '/cep/index.php';
            break;

        case 'webhook':
            if (count($segments) >= 2 && $segments[1] === 'pedidos') {
                // Rota: /api/webhook/pedidos
                require_once __DIR__ . '/webhook/pedidos.php';
            } else {
                Response::notFound('Recurso de webhook não encontrado');
            }
            break;

        default:
            Response::notFound('Recurso não encontrado');
    }
}
