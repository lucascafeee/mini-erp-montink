<?php
class Response
{
    public static function json($data, $statusCode = 200)
    {
        http_response_code($statusCode);
        echo json_encode($data);
        exit;
    }

    public static function success($data, $statusCode = 200)
    {
        self::json($data, $statusCode);
    }

    public static function error($message, $statusCode = 400)
    {
        self::json(['error' => $message], $statusCode);
    }

    public static function notFound($message = 'Recurso não encontrado')
    {
        self::error($message, 404);
    }

    public static function badRequest($message = 'Requisição inválida')
    {
        self::error($message, 400);
    }

    public static function unauthorized($message = 'Não autorizado')
    {
        self::error($message, 401);
    }

    public static function forbidden($message = 'Acesso negado')
    {
        self::error($message, 403);
    }

    public static function internalServerError($message = 'Erro interno do servidor')
    {
        self::error($message, 500);
    }
}
