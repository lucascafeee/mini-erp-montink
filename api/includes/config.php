<?php
// Carrega configurações do arquivo .env.php se existir
if (file_exists(dirname(__DIR__) . '/.env.php')) {
    require_once dirname(__DIR__) . '/.env.php';
}

// Configuração do banco de dados
define('DB_HOST', getenv('DB_HOST') ? getenv('DB_HOST') : 'localhost');
define('DB_USER', getenv('DB_USER') ? getenv('DB_USER') : 'root');
define('DB_PASSWORD', getenv('DB_PASSWORD') ? getenv('DB_PASSWORD') : '');
define('DB_NAME', getenv('DB_NAME') ? getenv('DB_NAME') : 'mini_erp');

// Configurações gerais
define('BASE_URL', '/api');
define('UPLOAD_DIR', dirname(__DIR__, 2) . '/uploads');

// Modo debug
define('DEBUG', getenv('DEBUG') ? filter_var(getenv('DEBUG'), FILTER_VALIDATE_BOOLEAN) : false);

// Se DEBUG estiver ativo, ativa exibição de erros
if (DEBUG) {
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
} else {
    ini_set('display_errors', 0);
    ini_set('display_startup_errors', 0);
}

// Headers para CORS e JSON
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Content-Type: application/json');

// Se for uma requisição OPTIONS (pre-flight), retorna 200 OK
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
