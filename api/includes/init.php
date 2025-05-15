<?php
// Carrega arquivos de configuração
require_once __DIR__ . '/config.php';

// Carrega classes do sistema
require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/Request.php';
require_once __DIR__ . '/Response.php';
require_once __DIR__ . '/Session.php';

// Configuração de logs
$logFile = dirname(__DIR__, 2) . '/logs/app-' . date('Y-m-d') . '.log';
$logDir = dirname($logFile);

// Cria diretório de logs se não existir
if (!file_exists($logDir)) {
    mkdir($logDir, 0755, true);
}

// Inicializa tratamento de erros
error_reporting(E_ALL);
ini_set('display_errors', DEBUG ? 1 : 0);
ini_set('log_errors', 1);
ini_set('error_log', $logFile);

// Tratamento de erros personalizado
set_error_handler(function ($errno, $errstr, $errfile, $errline) {
    if (!(error_reporting() & $errno)) {
        // Este código de erro não está incluído em error_reporting
        return false;
    }

    $message = "Erro: $errstr em $errfile na linha $errline";
    error_log($message);

    if (in_array($errno, [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        Response::internalServerError('Ocorreu um erro inesperado no servidor.');
    }

    return true;
}, E_ALL);

// Tratamento de exceções não capturadas
set_exception_handler(function ($exception) {
    $message = "Exceção: " . $exception->getMessage() . " em " .
        $exception->getFile() . " na linha " . $exception->getLine();
    error_log($message);
    Response::internalServerError('Ocorreu um erro inesperado no servidor.');
});
