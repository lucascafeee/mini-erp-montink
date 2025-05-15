import { NextResponse } from 'next/server';
import pool from '../config/database';

export async function GET() {
  try {
    const conn = await pool.getConnection();
    const [cupons] = await conn.query('SELECT * FROM cupons');
    conn.release();
    
    return NextResponse.json(cupons);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Erro ao buscar cupons' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { codigo, desconto, valor_minimo, data_inicio, data_fim, is_ativo } = body;
    
    if (!codigo || !desconto || !data_inicio || !data_fim) {
      return NextResponse.json(
        { error: 'Código, desconto, data início e data fim são obrigatórios' },
        { status: 400 }
      );
    }
    
    const conn = await pool.getConnection();
    
    try {
      // Verifica se já existe um cupom com o mesmo código
      const [cupomExistente] = await conn.query(
        'SELECT id FROM cupons WHERE codigo = ?',
        [codigo]
      );
      
      if (cupomExistente.length) {
        conn.release();
        return NextResponse.json(
          { error: 'Já existe um cupom com este código' },
          { status: 400 }
        );
      }
      
      // Insere o cupom
      const [result] = await conn.query(
        'INSERT INTO cupons (codigo, desconto, valor_minimo, data_inicio, data_fim, is_ativo) VALUES (?, ?, ?, ?, ?, ?)',
        [codigo, desconto, valor_minimo || 0, data_inicio, data_fim, is_ativo === false ? 0 : 1]
      );
      
      conn.release();
      
      return NextResponse.json({ 
        success: true, 
        cupom_id: result.insertId 
      }, { status: 201 });
    } catch (error) {
      conn.release();
      throw error;
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Erro ao criar cupom' },
      { status: 500 }
    );
  }
} 