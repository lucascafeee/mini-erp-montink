import { NextResponse } from 'next/server';
import pool from '../../config/database';

export async function POST(request) {
  try {
    const body = await request.json();
    const { codigo, subtotal } = body;
    
    if (!codigo) {
      return NextResponse.json(
        { error: 'Código do cupom é obrigatório' },
        { status: 400 }
      );
    }
    
    const conn = await pool.getConnection();
    
    // Busca o cupom
    const [cupons] = await conn.query(`
      SELECT * FROM cupons 
      WHERE codigo = ? 
        AND is_ativo = 1 
        AND data_inicio <= CURRENT_DATE() 
        AND data_fim >= CURRENT_DATE()
    `, [codigo]);
    
    conn.release();
    
    if (!cupons.length) {
      return NextResponse.json(
        { error: 'Cupom inválido ou expirado' },
        { status: 400 }
      );
    }
    
    const cupom = cupons[0];
    
    // Verifica valor mínimo
    if (subtotal && subtotal < cupom.valor_minimo) {
      return NextResponse.json({
        error: `Valor mínimo para este cupom é R$ ${cupom.valor_minimo.toFixed(2)}`,
        valido: false,
        valor_minimo: cupom.valor_minimo
      }, { status: 400 });
    }
    
    return NextResponse.json({
      valido: true,
      cupom: {
        id: cupom.id,
        codigo: cupom.codigo,
        desconto: cupom.desconto,
        valor_minimo: cupom.valor_minimo,
        data_inicio: cupom.data_inicio,
        data_fim: cupom.data_fim
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Erro ao verificar cupom' },
      { status: 500 }
    );
  }
} 