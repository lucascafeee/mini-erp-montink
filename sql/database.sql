-- Criação do banco de dados
CREATE DATABASE IF NOT EXISTS mini_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mini_erp;

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    preco DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de variações
CREATE TABLE IF NOT EXISTS variacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    produto_id INT NOT NULL,
    nome VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
);

-- Tabela de estoque
CREATE TABLE IF NOT EXISTS estoque (
    id INT AUTO_INCREMENT PRIMARY KEY,
    produto_id INT NOT NULL,
    variacao_id INT NULL,
    quantidade INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
    FOREIGN KEY (variacao_id) REFERENCES variacoes(id) ON DELETE CASCADE
);

-- Tabela de cupons
CREATE TABLE IF NOT EXISTS cupons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    desconto DECIMAL(10, 2) NOT NULL,
    valor_minimo DECIMAL(10, 2) NOT NULL DEFAULT 0,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    is_ativo BOOLEAN NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de pedidos
CREATE TABLE IF NOT EXISTS pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_nome VARCHAR(255) NOT NULL,
    cliente_email VARCHAR(255) NOT NULL,
    cliente_cep VARCHAR(10) NOT NULL,
    cliente_endereco TEXT NOT NULL,
    cliente_cidade VARCHAR(100) NOT NULL,
    cliente_estado VARCHAR(2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    frete DECIMAL(10, 2) NOT NULL,
    desconto DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    cupom_id INT NULL,
    status ENUM('pendente', 'pago', 'enviado', 'entregue', 'cancelado') NOT NULL DEFAULT 'pendente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cupom_id) REFERENCES cupons(id) ON DELETE SET NULL
);

-- Tabela de itens do pedido
CREATE TABLE IF NOT EXISTS pedido_itens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    produto_id INT NOT NULL,
    variacao_id INT NULL,
    quantidade INT NOT NULL,
    preco_unitario DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE RESTRICT,
    FOREIGN KEY (variacao_id) REFERENCES variacoes(id) ON DELETE RESTRICT
);

-- Produtos de exemplo
INSERT INTO produtos (nome, preco) VALUES 
('Camiseta Básica', 49.90),
('Calça Jeans', 129.90),
('Tênis Casual', 199.90);

-- Variações de exemplo
INSERT INTO variacoes (produto_id, nome) VALUES 
(1, 'P Branca'),
(1, 'M Branca'),
(1, 'G Branca'),
(1, 'P Preta'),
(1, 'M Preta'),
(1, 'G Preta'),
(2, '38'),
(2, '40'),
(2, '42'),
(2, '44'),
(3, '39'),
(3, '40'),
(3, '41'),
(3, '42');

-- Estoque de exemplo
INSERT INTO estoque (produto_id, variacao_id, quantidade) VALUES 
(1, 1, 10),
(1, 2, 15),
(1, 3, 8),
(1, 4, 5),
(1, 5, 12),
(1, 6, 7),
(2, 7, 3),
(2, 8, 6),
(2, 9, 9),
(2, 10, 4),
(3, 11, 2),
(3, 12, 5),
(3, 13, 8),
(3, 14, 3);

-- Cupons de exemplo
INSERT INTO cupons (codigo, desconto, valor_minimo, data_inicio, data_fim) VALUES 
('BEMVINDO10', 10.00, 0, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY)),
('DESCONTO20', 20.00, 100.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 15 DAY)),
('FRETE50', 50.00, 200.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 7 DAY)); 