#!/bin/bash

# Diretório raiz do projeto
PROJECT_ROOT="$(dirname "$(dirname "$(realpath "$0")")")"
API_DIR="$PROJECT_ROOT/api"
FRONTEND_DIR="$PROJECT_ROOT/mini-erp-montink"
LOGS_DIR="$PROJECT_ROOT/logs"
UPLOADS_DIR="$PROJECT_ROOT/uploads"

echo "Configurando o ambiente..."

# Verificar se as pastas logs e uploads existem na raiz
if [ ! -d "$LOGS_DIR" ]; then
    echo "Criando pasta de logs..."
    mkdir -p "$LOGS_DIR"
    touch "$LOGS_DIR/.gitkeep"
fi

if [ ! -d "$UPLOADS_DIR" ]; then
    echo "Criando pasta de uploads..."
    mkdir -p "$UPLOADS_DIR"
    touch "$UPLOADS_DIR/.gitkeep"
fi

# Criar arquivo .env.php para o PHP se não existir
if [ ! -f "$API_DIR/.env.php" ]; then
    echo "Criando arquivo .env.php..."
    cat > "$API_DIR/.env.php" << EOL
<?php
// Configurações do banco de dados
putenv('DB_HOST=localhost');
putenv('DB_USER=root');
putenv('DB_PASSWORD=');
putenv('DB_NAME=mini_erp');

// Modo debug (true para desenvolvimento, false para produção)
putenv('DEBUG=true');
EOL
    echo "Arquivo .env.php criado com sucesso!"
fi

# Criar arquivo .env.local para o Next.js se não existir
if [ ! -f "$FRONTEND_DIR/.env.local" ]; then
    echo "Criando arquivo .env.local..."
    cat > "$FRONTEND_DIR/.env.local" << EOL
# Configuração do banco de dados para API Routes Next.js
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=mini_erp

# URL do backend PHP para comunicação entre Next.js e backend
API_BASE_URL=http://localhost:8000
EOL
    echo "Arquivo .env.local criado com sucesso!"
fi

echo "Iniciando o servidor PHP e o Next.js..."
cd "$FRONTEND_DIR"
npx concurrently \
    "php -S localhost:8000 -t $API_DIR" \
    "npm run dev" 