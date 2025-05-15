'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';

interface Variacao {
  id: number;
  nome: string;
  estoque: number;
}

interface Produto {
  id: number;
  nome: string;
  preco: number;
  estoque: number;
  variacoes: Variacao[] | null;
}

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    async function fetchProdutos() {
      try {
        const response = await fetch('/api/produtos');
        if (!response.ok) {
          throw new Error('Erro ao buscar produtos');
        }
        const data = await response.json();
        setProdutos(data);
      } catch (error) {
        console.error(error);
        toast.error('Erro ao carregar produtos');
      } finally {
        setLoading(false);
      }
    }

    fetchProdutos();
  }, []);

  async function handleExcluir(id: number) {
    if (!confirm('Tem certeza que deseja excluir este produto?')) {
      return;
    }

    try {
      const response = await fetch(`/api/produtos/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir produto');
      }

      setProdutos(produtos.filter(produto => produto.id !== id));
      toast.success('Produto excluído com sucesso');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao excluir produto');
    }
  }

  async function handleComprar(produto: Produto) {
    try {
      const payload = {
        produto_id: produto.id,
        quantidade: 1
      };

      const response = await fetch('/api/carrinho', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao adicionar produto ao carrinho');
      }

      toast.success(`${produto.nome} adicionado ao carrinho`);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Erro ao adicionar produto ao carrinho');
    }
  }

  function formatarPreco(preco: number) {
    return preco.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }
  
  // Filtragem de produtos
  const produtosFiltrados = produtos.filter(produto => 
    produto.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Verifica se produto tem estoque
  const temEstoque = (produto: Produto) => {
    if (produto.variacoes && produto.variacoes.length > 0) {
      return produto.variacoes.some(v => v.estoque > 0);
    }
    return produto.estoque > 0;
  };

  return (
    <div className="pagina-produtos">
      <div className="cabecalho-pagina">
        <h1 className="titulo-pagina">
          Produtos
        </h1>
        
        <div className="controles-pagina">
          <div className="campo-busca">
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-busca"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="icone-busca" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <div className="controles-direita">
            <div className="alternar-visualizacao">
              <button
                onClick={() => setView('grid')}
                className={`botao-visualizacao ${view === 'grid' ? 'ativo' : ''}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setView('list')}
                className={`botao-visualizacao ${view === 'list' ? 'ativo' : ''}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <Link href="/produtos/novo">
              <button className="btn btn-primario">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Novo Produto
              </button>
            </Link>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="carregando">
          <div className="spinner"></div>
        </div>
      ) : produtosFiltrados.length === 0 ? (
        <div className="sem-resultados">
          {searchTerm ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="icone-sem-resultados" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="mensagem-sem-resultados">Nenhum produto encontrado para "{searchTerm}"</p>
              <button 
                onClick={() => setSearchTerm('')}
                className="limpar-busca"
              >
                Limpar busca
              </button>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="icone-sem-resultados" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <p className="mensagem-sem-resultados">Nenhum produto cadastrado</p>
              <Link href="/produtos/novo">
                <button className="btn btn-primario">
                  Cadastrar Produto
                </button>
              </Link>
            </>
          )}
        </div>
      ) : (
        view === 'grid' ? (
          <div className="grid-produtos">
            {produtosFiltrados.map((produto) => (
              <div key={produto.id} className="card-produto">
                <div className="imagem-produto">
                  <svg xmlns="http://www.w3.org/2000/svg" className="icone-produto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div className="detalhes-produto">
                  <div className="cabecalho-produto">
                    <h2 className="nome-produto">{produto.nome}</h2>
                    {temEstoque(produto) ? (
                      <span className="badge estoque">Em estoque</span>
                    ) : (
                      <span className="badge sem-estoque">Sem estoque</span>
                    )}
                  </div>
                  <p className="preco-produto">{formatarPreco(produto.preco)}</p>
                  
                  {produto.variacoes && produto.variacoes.length > 0 ? (
                    <div className="variacoes-produto">
                      <p className="titulo-variacoes">Variações:</p>
                      <div className="lista-variacoes">
                        {produto.variacoes.map((variacao) => (
                          <span 
                            key={variacao.id} 
                            className={`variacao ${variacao.estoque > 0 ? 'com-estoque' : 'sem-estoque'}`}
                          >
                            {variacao.nome} 
                            <span className="estoque-variacao">
                              ({variacao.estoque})
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="estoque-produto">
                      Estoque: <span className={produto.estoque > 0 ? 'positivo' : 'negativo'}>
                        {produto.estoque || 0}
                      </span>
                    </p>
                  )}
                  
                  <div className="acoes-produto">
                    <Link href={`/produtos/${produto.id}`} className="btn btn-secundario">
                      Detalhes
                    </Link>
                    <button 
                      onClick={() => handleComprar(produto)} 
                      className="btn btn-primario"
                      disabled={!temEstoque(produto)}
                    >
                      Comprar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="lista-produtos">
            {produtosFiltrados.map((produto) => (
              <div key={produto.id} className="item-produto">
                <div className="conteudo-produto">
                  <div className="info-produto">
                    <div className="imagem-produto-mini">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="nome-produto">{produto.nome}</h2>
                      <p className="preco-produto">{formatarPreco(produto.preco)}</p>
                    </div>
                  </div>
                  
                  <div className="estoque-info">
                    {produto.variacoes && produto.variacoes.length > 0 ? (
                      <div className="lista-variacoes-mini">
                        {produto.variacoes.map((variacao) => (
                          <span 
                            key={variacao.id} 
                            className={`variacao-mini ${variacao.estoque > 0 ? 'com-estoque' : 'sem-estoque'}`}
                          >
                            {variacao.nome} ({variacao.estoque})
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="estoque-produto">
                        Estoque: <span className={produto.estoque > 0 ? 'positivo' : 'negativo'}>
                          {produto.estoque || 0}
                        </span>
                      </p>
                    )}
                  </div>
                  
                  <div className="acoes-produto-lista">
                    <div className="badges-status">
                      {temEstoque(produto) ? (
                        <span className="badge estoque">Em estoque</span>
                      ) : (
                        <span className="badge sem-estoque">Sem estoque</span>
                      )}
                    </div>
                    <div className="botoes-acao">
                      <Link href={`/produtos/${produto.id}`} className="btn btn-secundario">
                        Detalhes
                      </Link>
                      <button
                        onClick={() => handleComprar(produto)}
                        className="btn btn-primario"
                        disabled={!temEstoque(produto)}
                      >
                        Comprar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
} 