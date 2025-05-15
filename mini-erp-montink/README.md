# Frontend Next.js do Mini ERP Montink

Este diretório contém a aplicação frontend do Mini ERP Montink, desenvolvida com Next.js.

## Configuração

1. Crie um arquivo `.env.local` na raiz desta pasta (mini-erp-montink) com o seguinte conteúdo:

```
# Configuração do banco de dados para API routes
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=mini_erp
```

2. Instale as dependências:

```bash
npm install
```

3. Execute o servidor de desenvolvimento:

```bash
npm run dev
```

4. Acesse a aplicação em: http://localhost:3000

## Páginas Disponíveis

- `/produtos` - Gerenciamento de produtos
- `/cupons` - Gerenciamento de cupons
- `/carrinho` - Carrinho de compras
- `/pedidos` - Histórico e detalhes de pedidos

## Observações Importantes

- A aplicação frontend se comunica com o banco de dados diretamente através das API routes do Next.js
- Certifique-se que o banco de dados MySQL está em execução antes de iniciar a aplicação
- Para o funcionamento completo do sistema, configure também o backend PHP conforme as instruções no README.md principal
