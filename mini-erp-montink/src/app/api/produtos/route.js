import { NextResponse } from 'next/server';
import pool from '../config/database';

export async function GET() {
  try {
    const conn = await pool.getConnection();
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
    `);
    conn.release();
    
    return NextResponse.json(produtos);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Erro ao buscar produtos' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
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
      
      // Insere o produto
      const [resultProduto] = await conn.query(
        'INSERT INTO produtos (nome, preco) VALUES (?, ?)',
        [nome, preco]
      );
      
      const produtoId = resultProduto.insertId;
      
      // Se tiver estoque sem variação, insere na tabela de estoque
      if (estoque !== undefined && !variacoes?.length) {
        await conn.query(
          'INSERT INTO estoque (produto_id, quantidade) VALUES (?, ?)',
          [produtoId, estoque]
        );
      }
      
      // Se tiver variações, insere cada uma
      if (variacoes?.length) {
        for (const variacao of variacoes) {
          const [resultVariacao] = await conn.query(
            'INSERT INTO variacoes (produto_id, nome) VALUES (?, ?)',
            [produtoId, variacao.nome]
          );
          
          const variacaoId = resultVariacao.insertId;
          
          // Insere o estoque da variação
          await conn.query(
            'INSERT INTO estoque (produto_id, variacao_id, quantidade) VALUES (?, ?, ?)',
            [produtoId, variacaoId, variacao.estoque || 0]
          );
        }
      }
      
      await conn.commit();
      
      return NextResponse.json({ 
        success: true, 
        produto_id: produtoId 
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
      { error: 'Erro ao criar produto' },
      { status: 500 }
    );
  }
} 