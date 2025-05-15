import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '../../config/database';

// Função para obter o carrinho atual
async function getCarrinho() {
  const cookieStore = cookies();
  const carrinhoData = cookieStore.get('carrinho');
  
  if (!carrinhoData?.value) {
    return {
      itens: [],
      subtotal: 0,
      frete: 0,
      desconto: 0,
      total: 0,
      cupom: null
    };
  }
  
  try {
    return JSON.parse(carrinhoData.value);
  } catch (error) {
    return {
      itens: [],
      subtotal: 0,
      frete: 0,
      desconto: 0,
      total: 0,
      cupom: null
    };
  }
}

// Função para salvar o carrinho
function saveCarrinho(carrinho) {
  const cookieStore = cookies();
  cookieStore.set('carrinho', JSON.stringify(carrinho), {
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 1 semana
    httpOnly: true,
    sameSite: 'strict'
  });
  
  return carrinho;
}

// Função para calcular o frete baseado no subtotal
function calcularFrete(subtotal) {
  if (subtotal >= 200) {
    return 0; // Frete grátis acima de R$ 200
  } else if (subtotal >= 52 && subtotal <= 166.59) {
    return 15; // Frete de R$ 15 entre R$ 52 e R$ 166,59
  } else {
    return 20; // Frete de R$ 20 para outros valores
  }
}

// Recalcula os valores do carrinho
function recalcularCarrinho(carrinho) {
  const subtotal = carrinho.itens.reduce((total, item) => 
    total + (item.preco * item.quantidade), 0);
  
  const frete = calcularFrete(subtotal);
  
  let desconto = 0;
  if (carrinho.cupom) {
    desconto = Math.min(subtotal, carrinho.cupom.desconto);
  }
  
  const total = subtotal + frete - desconto;
  
  return {
    ...carrinho,
    subtotal,
    frete,
    desconto,
    total
  };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { codigo } = body;
    
    if (!codigo) {
      return NextResponse.json(
        { error: 'Código do cupom é obrigatório' },
        { status: 400 }
      );
    }
    
    // Obtém o carrinho atual
    const carrinho = await getCarrinho();
    
    if (!carrinho.itens.length) {
      return NextResponse.json(
        { error: 'Carrinho vazio' },
        { status: 400 }
      );
    }
    
    const conn = await pool.getConnection();
    
    try {
      // Busca o cupom
      const [cupons] = await conn.query(`
        SELECT * FROM cupons 
        WHERE codigo = ? 
          AND is_ativo = 1 
          AND data_inicio <= CURRENT_DATE() 
          AND data_fim >= CURRENT_DATE()
      `, [codigo]);
      
      if (!cupons.length) {
        return NextResponse.json(
          { error: 'Cupom inválido ou expirado' },
          { status: 400 }
        );
      }
      
      const cupom = cupons[0];
      
      // Verifica valor mínimo
      if (carrinho.subtotal < cupom.valor_minimo) {
        return NextResponse.json({
          error: `Valor mínimo para este cupom é R$ ${cupom.valor_minimo.toFixed(2)}`,
          valor_minimo: cupom.valor_minimo
        }, { status: 400 });
      }
      
      // Aplica o cupom ao carrinho
      carrinho.cupom = {
        id: cupom.id,
        codigo: cupom.codigo,
        desconto: cupom.desconto
      };
      
      // Recalcula os valores
      const carrinhoAtualizado = recalcularCarrinho(carrinho);
      
      // Salva o carrinho
      saveCarrinho(carrinhoAtualizado);
      
      return NextResponse.json(carrinhoAtualizado);
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Erro ao aplicar cupom' },
      { status: 500 }
    );
  }
}

// Rota para remover cupom
export async function DELETE() {
  try {
    // Obtém o carrinho atual
    const carrinho = await getCarrinho();
    
    // Remove o cupom
    carrinho.cupom = null;
    
    // Recalcula os valores
    const carrinhoAtualizado = recalcularCarrinho(carrinho);
    
    // Salva o carrinho
    saveCarrinho(carrinhoAtualizado);
    
    return NextResponse.json(carrinhoAtualizado);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Erro ao remover cupom' },
      { status: 500 }
    );
  }
} 