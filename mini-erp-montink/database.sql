-- Criação do banco de dados
CREATE DATABASE IF NOT EXISTS mini_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mini_erp;

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS produtos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  preco DECIMAL(10, 2) NOT NULL,
  estoque INT DEFAULT 0,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de variações de produtos
CREATE TABLE IF NOT EXISTS variacoes_produtos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  produto_id INT NOT NULL,
  nome VARCHAR(255) NOT NULL,
  estoque INT DEFAULT 0,
  FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
);

-- Tabela de cupons
CREATE TABLE IF NOT EXISTS cupons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(50) NOT NULL UNIQUE,
  desconto DECIMAL(10, 2) NOT NULL,
  tipo ENUM('percentual', 'valor') NOT NULL DEFAULT 'percentual',
  data_inicio DATE,
  data_fim DATE,
  limite_usos INT DEFAULT NULL,
  usos_atuais INT DEFAULT 0,
  status TINYINT DEFAULT 1,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome_cliente VARCHAR(255) NOT NULL,
  email_cliente VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  endereco_entrega TEXT NOT NULL,
  cep_destino VARCHAR(10) NOT NULL,
  status ENUM('pendente', 'processando', 'enviado', 'entregue', 'cancelado') DEFAULT 'pendente',
  subtotal DECIMAL(10, 2) NOT NULL,
  desconto DECIMAL(10, 2) DEFAULT 0,
  frete DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  forma_pagamento VARCHAR(50) DEFAULT 'cartao',
  cupom_codigo VARCHAR(50) DEFAULT NULL,
  data_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de itens de pedidos
CREATE TABLE IF NOT EXISTS itens_pedido (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id INT NOT NULL,
  produto_id INT NOT NULL,
  nome_produto VARCHAR(255) NOT NULL, -- Mantém o nome mesmo se o produto for alterado
  variacao_id INT DEFAULT NULL,
  nome_variacao VARCHAR(255) DEFAULT NULL, -- Mantém o nome da variação mesmo se for alterada
  quantidade INT NOT NULL,
  preco_unitario DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
  FOREIGN KEY (produto_id) REFERENCES produtos(id),
  FOREIGN KEY (variacao_id) REFERENCES variacoes_produtos(id)
);

-- Tabela de carrinhos de compra
CREATE TABLE IF NOT EXISTS carrinhos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL UNIQUE,
  cupom_codigo VARCHAR(50) DEFAULT NULL,
  cep_destino VARCHAR(10) DEFAULT NULL,
  frete DECIMAL(10, 2) DEFAULT 0,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de itens do carrinho
CREATE TABLE IF NOT EXISTS itens_carrinho (
  id INT AUTO_INCREMENT PRIMARY KEY,
  carrinho_id INT NOT NULL,
  produto_id INT NOT NULL,
  nome VARCHAR(255) NOT NULL,
  preco DECIMAL(10, 2) NOT NULL,
  quantidade INT NOT NULL DEFAULT 1,
  variacao_id INT DEFAULT NULL,
  nome_variacao VARCHAR(255) DEFAULT NULL,
  FOREIGN KEY (carrinho_id) REFERENCES carrinhos(id) ON DELETE CASCADE,
  FOREIGN KEY (produto_id) REFERENCES produtos(id),
  FOREIGN KEY (variacao_id) REFERENCES variacoes_produtos(id)
);

-- Inserindo alguns produtos de exemplo
INSERT INTO produtos (nome, preco, estoque) VALUES 
('Camiseta Personalizada', 49.90, 50),
('Caneca Personalizada', 29.90, 30),
('Boné Personalizado', 39.90, 25),
('Adesivo Personalizado', 9.90, 100);

-- Inserindo variações para os produtos
INSERT INTO variacoes_produtos (produto_id, nome, estoque) VALUES 
(1, 'P', 15),
(1, 'M', 20),
(1, 'G', 15),
(2, 'Branca', 15),
(2, 'Preta', 15),
(3, 'Adulto', 15),
(3, 'Infantil', 10);

-- Inserindo cupons de exemplo
INSERT INTO cupons (codigo, desconto, tipo, data_inicio, data_fim, limite_usos) VALUES 
('BEMVINDO10', 10, 'percentual', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 100),
('FRETE20', 20, 'valor', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 15 DAY), 50); 