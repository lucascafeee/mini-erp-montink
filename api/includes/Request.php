<?php
class Request
{
    private $data = [];

    public function __construct()
    {
        $this->parseInput();
    }

    private function parseInput()
    {
        $method = $this->getMethod();

        if ($method === 'GET') {
            $this->data = $_GET;
        } else if (in_array($method, ['POST', 'PUT', 'DELETE'])) {
            $input = file_get_contents('php://input');
            if (!empty($input)) {
                $data = json_decode($input, true);
                if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
                    // Se não for JSON válido, tenta processar como form data
                    parse_str($input, $data);
                }
                $this->data = $data ?? [];
            }

            // Merge com $_POST para compatibilidade com formulários tradicionais
            if ($method === 'POST' && !empty($_POST)) {
                $this->data = array_merge($this->data, $_POST);
            }
        }
    }

    public function getMethod()
    {
        return $_SERVER['REQUEST_METHOD'];
    }

    public function get($key = null, $default = null)
    {
        if ($key === null) {
            return $this->data;
        }

        return $this->data[$key] ?? $default;
    }

    public function has($key)
    {
        return isset($this->data[$key]);
    }

    public function all()
    {
        return $this->data;
    }

    public function only($keys)
    {
        $keys = is_array($keys) ? $keys : func_get_args();
        $results = [];

        foreach ($keys as $key) {
            if ($this->has($key)) {
                $results[$key] = $this->get($key);
            }
        }

        return $results;
    }

    public function getQueryParam($key = null, $default = null)
    {
        if ($key === null) {
            return $_GET;
        }

        return $_GET[$key] ?? $default;
    }

    public function getPath()
    {
        $path = $_SERVER['REQUEST_URI'] ?? '/';
        $position = strpos($path, '?');

        if ($position !== false) {
            $path = substr($path, 0, $position);
        }

        return $path;
    }

    public function getSegments()
    {
        $path = trim($this->getPath(), '/');
        return $path === '' ? [] : explode('/', $path);
    }
}
