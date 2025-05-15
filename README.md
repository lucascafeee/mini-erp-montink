# Mini ERP - Montink

Um sistema de gerenciamento de produtos, pedidos, cupons e estoque.

## Tecnologias Utilizadas

- **Frontend**: Next.js, React, TailwindCSS
- **Backend**: PHP puro com RESTful API
- **Banco de Dados**: MySQL

## Funcionalidades

- Gerenciamento de produtos com suporte a variações
- Gerenciamento de estoque automático
- Sistema de cupons de desconto com regras de validação
- Carrinho de compras com persistência em sessão
- Cálculo automático de frete com regras específicas:
  - Entre R$52,00 e R$166,59: frete R$15,00
  - Acima de R$200,00: frete grátis
  - Outros valores: frete R$20,00

- Consulta de CEP via API ViaCEP
- Finalização de pedidos com envio de e-mail
- Webhook para atualização de status de pedidos

## Estrutura do Projeto

```
mini-erp-montink/ (diretório raiz)
├── api/                  # Backend API (PHP)
│   ├── includes/         # Classes e configurações do sistema
│   ├── produtos/         # Endpoints de produtos
│   ├── cupons/           # Endpoints de cupons
│   ├── carrinho/         # Endpoints de carrinho
│   ├── pedidos/          # Endpoints de pedidos
│   ├── cep/              # Endpoint de consulta de CEP
│   ├── webhook/          # Endpoint de webhooks
│   ├── .htaccess         # Configuração do Apache para rotas
│   └── index.php         # Front-controller da API
│
├── mini-erp-montink/     # Frontend (Next.js)
│   ├── src/              # Código fonte do frontend
│   │   ├── app/          # Páginas do Next.js
│   │   │   ├── api/      # API Routes do Next.js (frontend)
│   │   │   ├── carrinho/ # Página do carrinho
│   │   │   ├── cupons/   # Página de cupons
│   │   │   ├── pedidos/  # Página de pedidos
│   │   │   └── produtos/ # Páginas de produtos
│   ├── package.json      # Dependências do frontend
│   └── .env.local        # Configuração de ambiente do frontend
│
├── sql/                  # Scripts SQL
│   └── database.sql      # Script para criar o banco de dados
├── logs/                 # Logs do sistema
└── uploads/              # Arquivos enviados
```

## Como Executar

### Opção 1: Iniciar Todo o Projeto com Um Único Comando (Recomendado)

Temos duas formas de iniciar tanto o backend PHP quanto o frontend Next.js com um único comando:

#### Usando o Script Shell:

1. Acesse a pasta do frontend:

```bash
cd mini-erp-montink
```

2. Execute o script start-full.sh:

```bash
./start-full.sh
```

Este script irá:

- Criar automaticamente o arquivo `.env.php` na pasta do backend
- Criar automaticamente o arquivo `.env.local` na pasta do frontend
- Iniciar o servidor PHP na porta 8000
- Iniciar o servidor Next.js na porta 3000

#### Usando npm:

1. Acesse a pasta do frontend:

```bash
cd mini-erp-montink
```

2. Execute o comando:

```bash
npm run dev:full
```

### Opção 2: Configuração Manual (Passo a Passo)

Se preferir configurar e iniciar os serviços separadamente, siga as instruções abaixo:

#### 1. Configuração do Banco de Dados

Execute o script SQL que está no diretório `sql/database.sql` para criar o banco de dados e as tabelas necessárias:

```bash
# Execute este comando na pasta raiz do projeto
mysql -u root -p < sql/database.sql
```

#### 2. Configuração e Execução do Backend (PHP)

##### Requisitos do Backend:

- PHP 7.4 ou superior
- MySQL 5.7 ou superior
- Servidor web (Apache, Nginx) com suporte a PHP

##### Configuração do Backend:

1. Edite o arquivo `api/includes/config.php` para configurar a conexão com o banco de dados:

```php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASSWORD', 'sua_senha');
define('DB_NAME', 'mini_erp');
```

2. Configure seu servidor web (Apache/Nginx) para apontar para a pasta `api/` do projeto

   **Para Apache**: Crie um virtual host ou configure .htaccess

   **Para Nginx**: Crie um bloco server apontando para a pasta api/

3. Certifique-se que o módulo `mod_rewrite` esteja habilitado no Apache para as rotas funcionarem corretamente.

4. Alternativamente, você pode iniciar um servidor PHP simples para desenvolvimento:

```bash
cd api
php -S localhost:8000
```

#### 3. Configuração e Execução do Frontend (Next.js)

##### Requisitos do Frontend:

- Node.js 14 ou superior
- npm ou yarn

##### Configuração e Execução:

1. Navegue até a pasta do frontend:

```bash
cd mini-erp-montink
```

2. Crie um arquivo `.env.local` na pasta `mini-erp-montink/` com as configurações de ambiente:

```
# Configuração do banco de dados (utilizada pelas API routes)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=mini_erp

# URL base da API PHP (importante para comunicação entre front e back)
API_BASE_URL=http://localhost:8000
```

3. Instale as dependências:

```bash
npm install
```

4. Execute o servidor de desenvolvimento:

```bash
npm run dev
```

5. Acesse o frontend em: http://localhost:3000

## Acessando a Aplicação

### Endpoints da API PHP

Acesse a API PHP através da URL base do seu servidor web + `/api/...`
Exemplo: `http://localhost:8000/produtos`

### Interfaces do Frontend

- Produtos: http://localhost:3000/produtos
- Cupons: http://localhost:3000/cupons
- Carrinho: http://localhost:3000/carrinho
- Pedidos: http://localhost:3000/pedidos

## Endpoints da API

### Produtos

- `GET /api/produtos` - Listar todos os produtos
- `POST /api/produtos` - Criar um novo produto
- `GET /api/produtos/{id}` - Obter detalhes de um produto
- `PUT /api/produtos/{id}` - Atualizar um produto
- `DELETE /api/produtos/{id}` - Excluir um produto

### Cupons

- `GET /api/cupons` - Listar todos os cupons
- `POST /api/cupons` - Criar um novo cupom
- `POST /api/cupons/validar` - Validar um cupom

### Carrinho

- `GET /api/carrinho` - Obter o carrinho atual
- `POST /api/carrinho` - Adicionar item ao carrinho
- `PUT /api/carrinho` - Atualizar item do carrinho
- `DELETE /api/carrinho` - Limpar carrinho
- `POST /api/carrinho/aplicar-cupom` - Aplicar cupom ao carrinho
- `DELETE /api/carrinho/aplicar-cupom` - Remover cupom do carrinho

### Pedidos

- `GET /api/pedidos` - Listar todos os pedidos
- `POST /api/pedidos` - Criar um novo pedido

### CEP

- `GET /api/cep?cep=00000000` - Consultar endereço pelo CEP

### Webhook

- `POST /api/webhook/pedidos` - Atualizar status de um pedido

## Webhook para Atualização de Status

O sistema oferece um endpoint de webhook para atualizar o status de pedidos:

```
POST /api/webhook/pedidos
{
  "pedido_id": 123,
  "status": "enviado"
}
```

Valores válidos para `status`:

- `pendente`
- `pago`
- `enviado`
- `entregue`
- `cancelado`

Se o status for alterado para `cancelado`, o estoque será devolvido automaticamente.

## Recursos Implementados

- Integração com ViaCEP para preenchimento automático de endereço
- Envio de e-mail (simulado) ao finalizar pedidos
- Verificação de valor mínimo para aplicação de cupons
- Controle automático de estoque ao processar pedidos
- Cálculo automático de frete baseado no valor da compra


<img width="1512" alt="Captura de Tela 2025-05-15 às 20 16 38" src="https://github.com/user-attachments/assets/ae84e26e-9a1f-481c-a2bb-8b7eed27ecb0" />
