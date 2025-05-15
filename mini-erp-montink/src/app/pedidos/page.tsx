'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import Link from 'next/link';

interface ItemPedido {
  id: number;
  produto_id: number;
  nome_produto: string;
  quantidade: number;
  preco_unitario: number;
  variacao_id?: number;
  nome_variacao?: string;
}

interface Pedido {
  id: number;
  nome_cliente: string;
  email_cliente: string;
  endereco_entrega: string;
  cep_destino: string;
  status: 'pendente' | 'processando' | 'enviado' | 'entregue' | 'cancelado';
  subtotal: number;
  desconto: number;
  frete: number;
  total: number;
  data_pedido: string;
  itens: ItemPedido[];
  cupom_codigo?: string | null;
}

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('todos');

  const fetchPedidos = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/pedidos');
      if (!response.ok) {
        throw new Error('Erro ao buscar pedidos');
      }
      const data = await response.json();
      setPedidos(data.sort((a: Pedido, b: Pedido) => new Date(b.data_pedido).getTime() - new Date(a.data_pedido).getTime()));
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar pedidos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPedidos();
  }, [fetchPedidos]);

  function formatarPreco(valor: number) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function formatarData(dataString: string) {
    return new Date(dataString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  const statusLabels: Record<string, string> = {
    pendente: 'Pendente',
    processando: 'Processando',
    enviado: 'Enviado',
    entregue: 'Entregue',
    cancelado: 'Cancelado',
  };
  
  function toggleExpand(orderId: number) {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  }
  
  const filteredPedidos = pedidos.filter(pedido => {
      if (filterStatus === 'todos') return true;
      return pedido.status === filterStatus;
  });

  return (
    <div className="pagina-pedidos">
      <div className="cabecalho-pagina">
        <h1 className="titulo-pagina">
          Meus Pedidos
        </h1>
        <div className="filtro-pedidos">
          <label htmlFor="statusFilter" className="label-filtro">
            Filtrar por status:
          </label>
          <select 
            id="statusFilter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="select-filtro"
          >
            <option value="todos">Todos</option>
            <option value="pendente">Pendente</option>
            <option value="processando">Processando</option>
            <option value="enviado">Enviado</option>
            <option value="entregue">Entregue</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="carregando">
          <div className="spinner"></div>
        </div>
      ) : filteredPedidos.length === 0 ? (
        <div className="sem-resultados">
          <svg xmlns="http://www.w3.org/2000/svg" className="icone-sem-resultados" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <p className="mensagem-sem-resultados">
            {filterStatus === 'todos' ? 'Nenhum pedido encontrado' : `Nenhum pedido ${statusLabels[filterStatus].toLowerCase()} encontrado`}
          </p>
          <p className="texto-info-pedido">
            {filterStatus === 'todos' ? 'Você ainda não fez nenhum pedido.' : 'Não há pedidos com este status no momento.'}
          </p>
          {filterStatus !== 'todos' && (
            <button 
              onClick={() => setFilterStatus('todos')} 
              className="btn btn-primario"
            >
              Ver todos os pedidos
            </button>
          )}
        </div>
      ) : (
        <div className="lista-pedidos">
          {filteredPedidos.map((pedido) => (
            <div key={pedido.id} className="card-pedido">
              <div 
                className={`cabecalho-pedido ${expandedOrderId === pedido.id ? 'expandido' : ''}`} 
                onClick={() => toggleExpand(pedido.id)}
              >
                <div className="info-pedido">
                  <div className="numero-pedido">
                    <h2 className="titulo-pedido">
                      Pedido #{String(pedido.id).padStart(5, '0')}
                    </h2>
                    <span className={`badge badge-${pedido.status}`}>
                      {statusLabels[pedido.status] || pedido.status}
                    </span>
                  </div>
                  <p className="detalhes-data">
                    Feito em: {formatarData(pedido.data_pedido)} | Total: <span className="valor-destaque">{formatarPreco(pedido.total)}</span>
                  </p>
                </div>
                <div className="acoes-pedido">
                  <Link href={`/pedidos/${pedido.id}`} onClick={(e) => e.stopPropagation()}>
                    <button className="btn btn-secundario">Ver Detalhes</button>
                  </Link>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`icone-seta ${expandedOrderId === pedido.id ? 'rotacionado' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {expandedOrderId === pedido.id && (
                <div className="conteudo-pedido">
                  <div className="grid-info-cliente">
                    <div className="secao-info">
                      <h4 className="titulo-secao-pedido">Cliente</h4>
                      <p className="texto-info-pedido">{pedido.nome_cliente}</p>
                      <p className="texto-info-pedido">{pedido.email_cliente}</p>
                    </div>
                    <div className="secao-info">
                      <h4 className="titulo-secao-pedido">Endereço de Entrega</h4>
                      <p className="texto-info-pedido">{pedido.endereco_entrega}</p>
                      <p className="texto-info-pedido">CEP: {pedido.cep_destino}</p>
                    </div>
                  </div>

                  <h4 className="titulo-secao-pedido">Itens do Pedido</h4>
                  <div className="tabela-container">
                    <table className="tabela-itens">
                      <thead className="tabela-cabecalho">
                        <tr>
                          <th>Produto</th>
                          <th>Qtde.</th>
                          <th>Preço Unit.</th>
                          <th>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="tabela-corpo">
                        {pedido.itens.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <span className="produto-nome">{item.nome_produto}</span>
                              {item.nome_variacao && (
                                <span className="variacao-nome">({item.nome_variacao})</span>
                              )}
                            </td>
                            <td>{item.quantidade}</td>
                            <td>{formatarPreco(item.preco_unitario)}</td>
                            <td>{formatarPreco(item.preco_unitario * item.quantidade)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="resumo-valores">
                    <div className="linha-valor">
                      <span className="valor-label">Subtotal:</span>
                      <span className="valor-numero">{formatarPreco(pedido.subtotal)}</span>
                    </div>
                    {pedido.desconto > 0 && (
                      <div className="linha-valor desconto">
                        <span className="valor-label">
                          Desconto {pedido.cupom_codigo ? `(${pedido.cupom_codigo})` : ''}:
                        </span>
                        <span className="valor-numero">- {formatarPreco(pedido.desconto)}</span>
                      </div>
                    )}
                    <div className="linha-valor">
                      <span className="valor-label">Frete:</span>
                      <span className="valor-numero">{formatarPreco(pedido.frete)}</span>
                    </div>
                    <div className="linha-valor total">
                      <span className="valor-label">Total do Pedido:</span>
                      <span className="valor-numero">{formatarPreco(pedido.total)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 