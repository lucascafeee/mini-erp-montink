import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '../config/database';

// Função para obter o carrinho atual
async function getCarrinho() {
  const cookieStore = cookies();
  const carrinhoData = cookieStore.get('carrinho');
  
  if (!carrinhoData?.value) {
    return null;
  }
  
  try {
    return JSON.parse(carrinhoData.value);
  } catch (error) {
    return null;
  }
}

// Função para limpar o carrinho
function limparCarrinho() {
  const cookieStore = cookies();
  cookieStore.set('carrinho', '', {
    path: '/',
    maxAge: 0,
    httpOnly: true,
    sameSite: 'strict'
  });
}

// Função para enviar e-mail (mock)
async function enviarEmail(destinatario, assunto, corpo) {
  console.log(`Enviando e-mail para ${destinatario}`);
  console.log(`Assunto: ${assunto}`);
  console.log(`Corpo: ${corpo}`);
  
  // Em produção, aqui seria integrado um serviço de e-mail real
  // como SendGrid, Mailgun, AWS SES, etc.
  
  return true;
}

export async function GET() {
  try {
    const conn = await pool.getConnection();
    const [pedidos] = await conn.query(`
      SELECT p.*, 
        (SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', ip.id,
            'produto_id', ip.produto_id,
            'nome', (SELECT nome FROM produtos WHERE id = ip.produto_id),
            'variacao_id', ip.variacao_id,
            'variacao', (SELECT nome FROM variacoes WHERE id = ip.variacao_id),
            'quantidade', ip.quantidade,
            'preco_unitario', ip.preco_unitario,
            'subtotal', ip.subtotal
          )
        ) FROM itens_pedido ip WHERE ip.pedido_id = p.id) as itens
      FROM pedidos p
      ORDER BY p.created_at DESC
    `);
    conn.release();
    
    return NextResponse.json(pedidos);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Erro ao buscar pedidos' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      cliente_nome, 
      cliente_email, 
      cliente_cep, 
      cliente_endereco, 
      cliente_cidade,
      cliente_estado
    } = body;
    
    // Validação básica
    if (!cliente_nome || !cliente_email || !cliente_cep || !cliente_endereco || !cliente_cidade || !cliente_estado) {
      return NextResponse.json(
        { error: 'Todos os dados de entrega são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Obtém o carrinho
    const carrinho = await getCarrinho();
    
    if (!carrinho || !carrinho.itens.length) {
      return NextResponse.json(
        { error: 'Carrinho vazio' },
        { status: 400 }
      );
    }
    
    const conn = await pool.getConnection();
    
    try {
      await conn.beginTransaction();
      
      // Verifica estoque de todos os itens
      for (const item of carrinho.itens) {
        let estoqueQuery = 'SELECT quantidade FROM estoque WHERE produto_id = ?';
        let estoqueParams = [item.produto_id];
        
        if (item.variacao_id) {
          estoqueQuery += ' AND variacao_id = ?';
          estoqueParams.push(item.variacao_id);
        } else {
          estoqueQuery += ' AND variacao_id IS NULL';
        }
        
        const [estoques] = await conn.query(estoqueQuery, estoqueParams);
        
        if (!estoques.length || estoques[0].quantidade < item.quantidade) {
          await conn.rollback();
          return NextResponse.json(
            { error: `Estoque insuficiente para o produto ${item.nome}${item.variacao ? ` (${item.variacao})` : ''}` },
            { status: 400 }
          );
        }
      }
      
      // Insere o pedido
      const [resultPedido] = await conn.query(
        `INSERT INTO pedidos (
          cliente_nome, cliente_email, cliente_cep, cliente_endereco, 
          cliente_cidade, cliente_estado, subtotal, frete, desconto, total, cupom_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          cliente_nome,
          cliente_email,
          cliente_cep,
          cliente_endereco,
          cliente_cidade,
          cliente_estado,
          carrinho.subtotal,
          carrinho.frete,
          carrinho.desconto,
          carrinho.total,
          carrinho.cupom?.id || null
        ]
      );
      
      const pedidoId = resultPedido.insertId;
      
      // Insere os itens do pedido e atualiza o estoque
      for (const item of carrinho.itens) {
        // Insere o item
        await conn.query(
          `INSERT INTO itens_pedido (
            pedido_id, produto_id, variacao_id, quantidade, preco_unitario, subtotal
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            pedidoId,
            item.produto_id,
            item.variacao_id || null,
            item.quantidade,
            item.preco,
            item.preco * item.quantidade
          ]
        );
        
        // Atualiza o estoque
        let estoqueQuery = 'UPDATE estoque SET quantidade = quantidade - ? WHERE produto_id = ?';
        let estoqueParams = [item.quantidade, item.produto_id];
        
        if (item.variacao_id) {
          estoqueQuery += ' AND variacao_id = ?';
          estoqueParams.push(item.variacao_id);
        } else {
          estoqueQuery += ' AND variacao_id IS NULL';
        }
        
        await conn.query(estoqueQuery, estoqueParams);
      }
      
      await conn.commit();
      
      // Limpa o carrinho após finalizar o pedido
      limparCarrinho();
      
      // Enviar e-mail de confirmação
      const corpoEmail = `
        Olá ${cliente_nome},
        
        Seu pedido #${pedidoId} foi recebido com sucesso!
        
        Resumo do pedido:
        ${carrinho.itens.map(item => `- ${item.nome}${item.variacao ? ` (${item.variacao})` : ''}: ${item.quantidade} x R$ ${item.preco.toFixed(2)} = R$ ${(item.quantidade * item.preco).toFixed(2)}`).join('\n')}
        
        Subtotal: R$ ${carrinho.subtotal.toFixed(2)}
        ${carrinho.desconto > 0 ? `Desconto: R$ ${carrinho.desconto.toFixed(2)}` : ''}
        Frete: R$ ${carrinho.frete.toFixed(2)}
        Total: R$ ${carrinho.total.toFixed(2)}
        
        Endereço de entrega:
        ${cliente_endereco}
        ${cliente_cidade}/${cliente_estado}
        CEP: ${cliente_cep}
        
        Obrigado por comprar conosco!
      `;
      
      await enviarEmail(
        cliente_email,
        `Confirmação de Pedido #${pedidoId}`,
        corpoEmail
      );
      
      return NextResponse.json({ 
        success: true, 
        pedido_id: pedidoId 
      }, { status: 201 });
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Erro ao criar pedido' },
      { status: 500 }
    );
  }
} 