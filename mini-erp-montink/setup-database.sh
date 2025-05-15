#!/bin/bash

# Script para configurar o banco de dados e ambiente do Mini-ERP Montink

echo "=========================================="
echo "Configurando o Mini-ERP Montink"
echo "=========================================="

# Verificar se o MySQL está instalado
if ! command -v mysql &> /dev/null; then
    echo "MySQL não encontrado. Por favor, instale o MySQL antes de continuar."
    exit 1
fi

# Definindo variáveis
DB_HOST="localhost"
DB_USER="root"
read -sp "Digite a senha do MySQL (deixe em branco se não houver): " DB_PASSWORD
echo ""
DB_NAME="mini_erp"

# Criar arquivo .env.local 
echo "Criando arquivo .env.local..."
cat > .env.local <<EOL
# Configuração do banco de dados para API routes
DB_HOST=${DB_HOST}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME}

# URLs e configurações da API
NEXT_PUBLIC_API_URL=http://localhost:3000/api
EOL

echo "Arquivo .env.local criado com sucesso!"

# Verificar se o arquivo database.sql existe
if [ ! -f "database.sql" ]; then
    echo "Arquivo database.sql não encontrado!"
    exit 1
fi

# Criar o banco de dados e importar a estrutura
echo "Criando banco de dados e importando estrutura..."

if [ -z "$DB_PASSWORD" ]; then
    # Sem senha
    mysql -u "${DB_USER}" -h "${DB_HOST}" <<EOF
    CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EOF
    mysql -u "${DB_USER}" -h "${DB_HOST}" "${DB_NAME}" < database.sql
else
    # Com senha
    mysql -u "${DB_USER}" -p"${DB_PASSWORD}" -h "${DB_HOST}" <<EOF
    CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EOF
    mysql -u "${DB_USER}" -p"${DB_PASSWORD}" -h "${DB_HOST}" "${DB_NAME}" < database.sql
fi

if [ $? -eq 0 ]; then
    echo "Banco de dados criado e estrutura importada com sucesso!"
else
    echo "Erro ao criar o banco de dados ou importar a estrutura."
    exit 1
fi

# Instalar dependências
echo "Instalando dependências..."
npm install

echo "=========================================="
echo "Configuração concluída com sucesso!"
echo "Para iniciar o servidor, execute: npm run dev"
echo "==========================================" 