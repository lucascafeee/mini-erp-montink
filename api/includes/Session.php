<?php
class Session
{
    public static function start()
    {
        if (session_status() === PHP_SESSION_NONE) {
            // Define cookie params para melhorar a segurança
            session_set_cookie_params([
                'lifetime' => 86400, // 1 dia
                'path' => '/',
                'secure' => isset($_SERVER['HTTPS']),
                'httponly' => true,
                'samesite' => 'Lax'
            ]);

            session_start();
        }
    }

    public static function set($key, $value)
    {
        self::start();
        $_SESSION[$key] = $value;
    }

    public static function get($key, $default = null)
    {
        self::start();
        return $_SESSION[$key] ?? $default;
    }

    public static function has($key)
    {
        self::start();
        return isset($_SESSION[$key]);
    }

    public static function remove($key)
    {
        self::start();
        if (isset($_SESSION[$key])) {
            unset($_SESSION[$key]);
            return true;
        }
        return false;
    }

    public static function clear()
    {
        self::start();
        session_unset();
        session_destroy();
    }

    public static function all()
    {
        self::start();
        return $_SESSION;
    }

    public static function id()
    {
        self::start();
        return session_id();
    }

    public static function regenerate()
    {
        self::start();
        return session_regenerate_id(true);
    }
}
