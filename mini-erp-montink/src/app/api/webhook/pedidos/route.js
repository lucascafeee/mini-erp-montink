import { NextResponse } from 'next/server';
import pool from '../../config/database';

export async function POST(request) {
  try {
    const body = await request.json();
    const { pedido_id, status } = body;
    
    if (!pedido_id || !status) {
      return NextResponse.json(
        { error: 'ID do pedido e status são obrigatórios' },
        { status: 400 }
      );
    }
    
    const conn = await pool.getConnection();
    
    try {
      // Verifica se o pedido existe
      const [pedidos] = await conn.query('SELECT id FROM pedidos WHERE id = ?', [pedido_id]);
      
      if (!pedidos.length) {
        return NextResponse.json(
          { error: 'Pedido não encontrado' },
          { status: 404 }
        );
      }
      
      // Valida o status
      const statusesValidos = ['pendente', 'pago', 'enviado', 'entregue', 'cancelado'];
      
      if (!statusesValidos.includes(status)) {
        return NextResponse.json(
          { error: 'Status inválido' },
          { status: 400 }
        );
      }
      
      if (status === 'cancelado') {
        // Se o status for cancelado, exclui o pedido
        await conn.beginTransaction();
        
        try {
          // Recupera os itens do pedido para devolver ao estoque
          const [itens] = await conn.query(
            'SELECT produto_id, variacao_id, quantidade FROM itens_pedido WHERE pedido_id = ?',
            [pedido_id]
          );
          
          // Devolve os itens ao estoque
          for (const item of itens) {
            let estoqueQuery = 'UPDATE estoque SET quantidade = quantidade + ? WHERE produto_id = ?';
            let estoqueParams = [item.quantidade, item.produto_id];
            
            if (item.variacao_id) {
              estoqueQuery += ' AND variacao_id = ?';
              estoqueParams.push(item.variacao_id);
            } else {
              estoqueQuery += ' AND variacao_id IS NULL';
            }
            
            await conn.query(estoqueQuery, estoqueParams);
          }
          
          // Exclui os itens do pedido e o pedido
          await conn.query('DELETE FROM itens_pedido WHERE pedido_id = ?', [pedido_id]);
          await conn.query('DELETE FROM pedidos WHERE id = ?', [pedido_id]);
          
          await conn.commit();
          
          return NextResponse.json({ 
            success: true,
            message: 'Pedido cancelado e excluído com sucesso'
          });
        } catch (error) {
          await conn.rollback();
          throw error;
        }
      } else {
        // Atualiza o status do pedido
        await conn.query(
          'UPDATE pedidos SET status = ? WHERE id = ?',
          [status, pedido_id]
        );
        
        return NextResponse.json({ 
          success: true,
          message: `Status do pedido atualizado para ${status}`
        });
      }
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Erro ao processar webhook' },
      { status: 500 }
    );
  }
} 