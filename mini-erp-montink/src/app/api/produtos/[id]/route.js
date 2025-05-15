import { NextResponse } from 'next/server';
import pool from '../../config/database';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    const conn = await pool.getConnection();
    
    // Busca produto com variações e estoque
    const [produtos] = await conn.query(`
      SELECT p.*, 
        (SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', v.id,
            'nome', v.nome,
            'estoque', (SELECT quantidade FROM estoque WHERE variacao_id = v.id)
          )
        ) FROM variacoes v WHERE v.produto_id = p.id) as variacoes,
        (SELECT quantidade FROM estoque WHERE produto_id = p.id AND variacao_id IS NULL) as estoque
      FROM produtos p
      WHERE p.id = ?
    `, [id]);
    
    conn.release();
    
    if (!produtos.length) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(produtos[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Erro ao buscar produto' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { nome, preco, variacoes, estoque } = body;
    
    if (!nome || !preco) {
      return NextResponse.json(
        { error: 'Nome e preço são obrigatórios' },
        { status: 400 }
      );
    }
    
    const conn = await pool.getConnection();
    
    try {
      await conn.beginTransaction();
      
      // Verifica se o produto existe
      const [produto] = await conn.query('SELECT id FROM produtos WHERE id = ?', [id]);
      
      if (!produto.length) {
        await conn.rollback();
        conn.release();
        return NextResponse.json(
          { error: 'Produto não encontrado' },
          { status: 404 }
        );
      }
      
      // Atualiza o produto
      await conn.query(
        'UPDATE produtos SET nome = ?, preco = ? WHERE id = ?',
        [nome, preco, id]
      );
      
      // Se tem estoque sem variação, atualiza
      if (estoque !== undefined && !variacoes?.length) {
        const [estoqueExistente] = await conn.query(
          'SELECT id FROM estoque WHERE produto_id = ? AND variacao_id IS NULL',
          [id]
        );
        
        if (estoqueExistente.length) {
          await conn.query(
            'UPDATE estoque SET quantidade = ? WHERE produto_id = ? AND variacao_id IS NULL',
            [estoque, id]
          );
        } else {
          await conn.query(
            'INSERT INTO estoque (produto_id, quantidade) VALUES (?, ?)',
            [id, estoque]
          );
        }
      }
      
      // Se tem variações, atualiza cada uma
      if (variacoes?.length) {
        for (const variacao of variacoes) {
          if (variacao.id) {
            // Atualiza variação existente
            await conn.query(
              'UPDATE variacoes SET nome = ? WHERE id = ?',
              [variacao.nome, variacao.id]
            );
            
            // Atualiza estoque da variação
            await conn.query(
              'UPDATE estoque SET quantidade = ? WHERE variacao_id = ?',
              [variacao.estoque || 0, variacao.id]
            );
          } else {
            // Insere nova variação
            const [resultVariacao] = await conn.query(
              'INSERT INTO variacoes (produto_id, nome) VALUES (?, ?)',
              [id, variacao.nome]
            );
            
            const variacaoId = resultVariacao.insertId;
            
            // Insere estoque da nova variação
            await conn.query(
              'INSERT INTO estoque (produto_id, variacao_id, quantidade) VALUES (?, ?, ?)',
              [id, variacaoId, variacao.estoque || 0]
            );
          }
        }
      }
      
      await conn.commit();
      
      return NextResponse.json({ success: true });
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Erro ao atualizar produto' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    const conn = await pool.getConnection();
    
    try {
      await conn.beginTransaction();
      
      // Verifica se o produto existe
      const [produto] = await conn.query('SELECT id FROM produtos WHERE id = ?', [id]);
      
      if (!produto.length) {
        await conn.rollback();
        conn.release();
        return NextResponse.json(
          { error: 'Produto não encontrado' },
          { status: 404 }
        );
      }
      
      // Exclui o produto (as exclusões em cascata lidarão com variações e estoque)
      await conn.query('DELETE FROM produtos WHERE id = ?', [id]);
      
      await conn.commit();
      
      return NextResponse.json({ success: true });
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Erro ao excluir produto' },
      { status: 500 }
    );
  }
} 