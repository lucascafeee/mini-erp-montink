import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '../config/database';

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

// GET - Obtém o carrinho atual
export async function GET() {
  try {
    const carrinho = await getCarrinho();
    return NextResponse.json(carrinho);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Erro ao obter carrinho' },
      { status: 500 }
    );
  }
}

// POST - Adiciona um item ao carrinho
export async function POST(request) {
  try {
    const body = await request.json();
    const { produto_id, variacao_id, quantidade = 1 } = body;
    
    if (!produto_id) {
      return NextResponse.json(
        { error: 'ID do produto é obrigatório' },
        { status: 400 }
      );
    }
    
    const conn = await pool.getConnection();
    
    try {
      // Busca o produto
      const [produtos] = await conn.query('SELECT id, nome, preco FROM produtos WHERE id = ?', [produto_id]);
      
      if (!produtos.length) {
        return NextResponse.json(
          { error: 'Produto não encontrado' },
          { status: 404 }
        );
      }
      
      const produto = produtos[0];
      
      // Verifica o estoque
      let estoqueQuery = 'SELECT quantidade FROM estoque WHERE produto_id = ?';
      let estoqueParams = [produto_id];
      
      if (variacao_id) {
        estoqueQuery += ' AND variacao_id = ?';
        estoqueParams.push(variacao_id);
        
        // Busca o nome da variação
        const [variacoes] = await conn.query(
          'SELECT nome FROM variacoes WHERE id = ?',
          [variacao_id]
        );
        
        if (!variacoes.length) {
          return NextResponse.json(
            { error: 'Variação não encontrada' },
            { status: 404 }
          );
        }
        
        produto.variacao = variacoes[0].nome;
      } else {
        estoqueQuery += ' AND variacao_id IS NULL';
      }
      
      const [estoques] = await conn.query(estoqueQuery, estoqueParams);
      
      if (!estoques.length || estoques[0].quantidade < quantidade) {
        return NextResponse.json(
          { error: 'Estoque insuficiente' },
          { status: 400 }
        );
      }
      
      // Obtém o carrinho atual
      const carrinho = await getCarrinho();
      
      // Verifica se o produto já está no carrinho
      const itemIndex = carrinho.itens.findIndex(item => 
        item.produto_id === produto_id && item.variacao_id === variacao_id
      );
      
      if (itemIndex >= 0) {
        // Atualiza a quantidade do item
        const novaQuantidade = carrinho.itens[itemIndex].quantidade + quantidade;
        
        // Verifica novamente se há estoque suficiente
        if (novaQuantidade > estoques[0].quantidade) {
          return NextResponse.json(
            { error: 'Estoque insuficiente' },
            { status: 400 }
          );
        }
        
        carrinho.itens[itemIndex].quantidade = novaQuantidade;
      } else {
        // Adiciona o novo item
        carrinho.itens.push({
          produto_id,
          variacao_id,
          nome: produto.nome,
          variacao: produto.variacao || null,
          preco: produto.preco,
          quantidade
        });
      }
      
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
      { error: 'Erro ao adicionar item ao carrinho' },
      { status: 500 }
    );
  }
}

// PUT - Atualiza um item específico no carrinho
export async function PUT(request) {
  try {
    const body = await request.json();
    const { produto_id, variacao_id, quantidade } = body;
    
    if (!produto_id || quantidade === undefined) {
      return NextResponse.json(
        { error: 'ID do produto e quantidade são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Obtém o carrinho atual
    const carrinho = await getCarrinho();
    
    // Verifica se o produto está no carrinho
    const itemIndex = carrinho.itens.findIndex(item => 
      item.produto_id === produto_id && item.variacao_id === variacao_id
    );
    
    if (itemIndex < 0) {
      return NextResponse.json(
        { error: 'Item não encontrado no carrinho' },
        { status: 404 }
      );
    }
    
    if (quantidade <= 0) {
      // Remove o item do carrinho
      carrinho.itens.splice(itemIndex, 1);
    } else {
      // Verifica o estoque
      const conn = await pool.getConnection();
      
      try {
        let estoqueQuery = 'SELECT quantidade FROM estoque WHERE produto_id = ?';
        let estoqueParams = [produto_id];
        
        if (variacao_id) {
          estoqueQuery += ' AND variacao_id = ?';
          estoqueParams.push(variacao_id);
        } else {
          estoqueQuery += ' AND variacao_id IS NULL';
        }
        
        const [estoques] = await conn.query(estoqueQuery, estoqueParams);
        
        if (!estoques.length || estoques[0].quantidade < quantidade) {
          return NextResponse.json(
            { error: 'Estoque insuficiente' },
            { status: 400 }
          );
        }
        
        // Atualiza a quantidade
        carrinho.itens[itemIndex].quantidade = quantidade;
      } finally {
        conn.release();
      }
    }
    
    // Recalcula os valores
    const carrinhoAtualizado = recalcularCarrinho(carrinho);
    
    // Salva o carrinho
    saveCarrinho(carrinhoAtualizado);
    
    return NextResponse.json(carrinhoAtualizado);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Erro ao atualizar item no carrinho' },
      { status: 500 }
    );
  }
}

// DELETE - Limpa o carrinho
export async function DELETE() {
  try {
    const carrinho = {
      itens: [],
      subtotal: 0,
      frete: 0,
      desconto: 0,
      total: 0,
      cupom: null
    };
    
    saveCarrinho(carrinho);
    
    return NextResponse.json(carrinho);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Erro ao limpar carrinho' },
      { status: 500 }
    );
  }
} 