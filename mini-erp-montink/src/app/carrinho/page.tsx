'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';

interface ItemCarrinho {
  id: number;
  produto_id: number;
  nome: string;
  preco: number;
  quantidade: number;
  variacao_id?: number;
  nome_variacao?: string;
}

interface Carrinho {
  itens: ItemCarrinho[];
  subtotal: number;
  desconto: number;
  total: number;
  frete: number;
  cep_destino: string | null;
  cupom_codigo: string | null;
}

interface Endereco {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  numero: string;
}

export default function CarrinhoPage() {
  const [carrinho, setCarrinho] = useState<Carrinho | null>(null);
  const [loading, setLoading] = useState(true);
  const [cupomCodigo, setCupomCodigo] = useState('');
  const [cep, setCep] = useState('');
  const [endereco, setEndereco] = useState<Endereco | null>(null);
  const [checkoutData, setCheckoutData] = useState({
    nome: '',
    email: '',
    telefone: '',
    enderecoCompleto: '',
    numeroEndereco: '',
    complementoEndereco: '',
    formaPagamento: 'cartao',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const router = useRouter();

  const fetchCarrinho = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/carrinho');
      if (!response.ok) throw new Error('Erro ao buscar carrinho');
      const data = await response.json();
      setCarrinho(data);
      if (data.cupom_codigo) setCupomCodigo(data.cupom_codigo);
      if (data.cep_destino) setCep(data.cep_destino);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar carrinho.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCarrinho();
  }, [fetchCarrinho]);

  async function handleAtualizarQuantidade(item_id: number, quantidade: number) {
    if (quantidade < 1) {
      handleRemoverItem(item_id);
      return;
    }
    try {
      const response = await fetch('/api/carrinho', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id, quantidade }),
      });
      if (!response.ok) throw new Error('Erro ao atualizar quantidade');
      fetchCarrinho();
      toast.success('Quantidade atualizada.');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao atualizar quantidade.');
    }
  }

  async function handleRemoverItem(item_id: number) {
    try {
      const response = await fetch('/api/carrinho', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id }),
      });
      if (!response.ok) throw new Error('Erro ao remover item');
      fetchCarrinho();
      toast.success('Item removido do carrinho.');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao remover item.');
    }
  }

  async function handleLimparCarrinho() {
    if (!confirm('Tem certeza que deseja limpar o carrinho?')) return;
    try {
      const response = await fetch('/api/carrinho/limpar', { method: 'POST' });
      if (!response.ok) throw new Error('Erro ao limpar carrinho');
      fetchCarrinho();
      toast.success('Carrinho limpo.');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao limpar carrinho.');
    }
  }

  async function handleAplicarCupom() {
    if (!cupomCodigo.trim()) {
      toast.info('Digite um código de cupom.');
      return;
    }
    try {
      const response = await fetch('/api/carrinho/cupom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: cupomCodigo }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao aplicar cupom');
      fetchCarrinho();
      toast.success(data.success || 'Cupom aplicado!');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Erro ao aplicar cupom.');
    }
  }
  
  async function handleRemoverCupom() {
    try {
      const response = await fetch('/api/carrinho/cupom', { method: 'DELETE' });
      if (!response.ok) throw new Error('Erro ao remover cupom');
      fetchCarrinho();
      setCupomCodigo('');
      toast.success('Cupom removido.');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao remover cupom.');
    }
  }

  async function handleBuscarCep() {
    if (cep.replace(/\D/g, '').length !== 8) {
      toast.info('CEP inválido. Digite 8 números.');
      return;
    }
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep.replace(/\D/g, '')}/json/`);
      if (!response.ok) throw new Error('Erro ao buscar CEP');
      const data = await response.json();
      if (data.erro) {
        toast.error('CEP não encontrado.');
        setEndereco(null);
        return;
      }
      setEndereco({
        ...data,
        numero: checkoutData.numeroEndereco, 
        complemento: checkoutData.complementoEndereco
      });
      setCheckoutData(prev => ({ ...prev, enderecoCompleto: `${data.logradouro}, ${data.bairro} - ${data.localidade}/${data.uf}` }));
      toast.success('Endereço encontrado!');
      // Atualizar frete no backend
      await fetch('/api/carrinho/frete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cep: cep.replace(/\D/g, '') }),
      });
      fetchCarrinho(); // Recarrega o carrinho para exibir o frete
    } catch (error) {
      console.error(error);
      toast.error('Erro ao buscar CEP.');
    }
  }

  function handleCheckoutChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setCheckoutData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (name === 'numeroEndereco' && endereco) {
      setEndereco(prev => prev ? { ...prev, numero: value } : null);
    }
    if (name === 'complementoEndereco' && endereco) {
      setEndereco(prev => prev ? { ...prev, complemento: value } : null);
    }
  }

  async function handleFinalizarPedido(e: React.FormEvent) {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!checkoutData.nome.trim()) errors.nome = 'Nome completo é obrigatório';
    if (!checkoutData.email.trim() || !/\S+@\S+\.\S+/.test(checkoutData.email)) errors.email = 'Email inválido';
    if (!checkoutData.telefone.trim() || checkoutData.telefone.replace(/\D/g, '').length < 10) errors.telefone = 'Telefone inválido';
    if (!cep.trim()) errors.cep = 'CEP é obrigatório para entrega';
    if (!checkoutData.enderecoCompleto.trim() && !endereco) errors.enderecoCompleto = 'Endereço de entrega é obrigatório';
    if (!checkoutData.numeroEndereco.trim() && !endereco?.numero) errors.numeroEndereco = 'Número do endereço é obrigatório';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Por favor, corrija os erros no formulário.');
      return;
    }

    if (!carrinho || carrinho.itens.length === 0) {
      toast.error('Seu carrinho está vazio!');
      return;
    }

    try {
      const payload = {
        ...checkoutData,
        cep: cep.replace(/\D/g, ''),
        endereco: endereco ? `${endereco.logradouro}, ${checkoutData.numeroEndereco || endereco.numero}${checkoutData.complementoEndereco || endereco.complemento ? ', ' + (checkoutData.complementoEndereco || endereco.complemento) : ''} - ${endereco.bairro}, ${endereco.localidade} - ${endereco.uf}` : checkoutData.enderecoCompleto,
        itens: carrinho.itens,
        subtotal: carrinho.subtotal,
        desconto: carrinho.desconto,
        frete: carrinho.frete,
        total: carrinho.total,
        cupom_codigo: carrinho.cupom_codigo,
      };

      const response = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Erro ao finalizar pedido');
      
      toast.success('Pedido finalizado com sucesso! Você será redirecionado.');
      // Limpar carrinho localmente após sucesso, pode ser feito no backend também
      setCarrinho(null); 
      setTimeout(() => {
        router.push(`/pedidos/${result.pedido_id}`); 
      }, 2000);

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Erro ao finalizar pedido.');
    }
  }

  function formatarPreco(valor: number) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function formatarCep(valor: string) {
    const cepDigits = valor.replace(/\D/g, '');
    if (cepDigits.length <= 5) return cepDigits;
    return `${cepDigits.slice(0, 5)}-${cepDigits.slice(5, 8)}`;
  }

  function handleCepChange(e: React.ChangeEvent<HTMLInputElement>) {
    const rawValue = e.target.value;
    setCep(formatarCep(rawValue));
  }

  if (loading) {
    return (
      <div className="carregando">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!carrinho || carrinho.itens.length === 0) {
    return (
      <div className="sem-resultados">
        <svg xmlns="http://www.w3.org/2000/svg" className="icone-sem-resultados" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <p className="mensagem-sem-resultados">Seu carrinho está vazio</p>
        <Link href="/produtos" className="btn btn-primario">
          Continuar Comprando
        </Link>
      </div>
    );
  }

  return (
    <div className="pagina-carrinho">
      <div className="cabecalho-pagina">
        <h1 className="titulo-pagina">
          Carrinho de Compras
        </h1>
        
        {carrinho && carrinho.itens.length > 0 && (
          <button
            onClick={handleLimparCarrinho}
            className="btn btn-secundario"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Limpar Carrinho
          </button>
        )}
      </div>

      {loading ? (
        <div className="carregando">
          <div className="spinner"></div>
        </div>
      ) : !carrinho || carrinho.itens.length === 0 ? (
        <div className="sem-resultados">
          <svg xmlns="http://www.w3.org/2000/svg" className="icone-sem-resultados" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="mensagem-sem-resultados">Seu carrinho está vazio</p>
          <Link href="/produtos" className="btn btn-primario">
            Continuar Comprando
          </Link>
        </div>
      ) : (
        <>
          <div className="grid-carrinho">
            <div className="lista-itens-carrinho">
              {carrinho.itens.map(item => (
                <div key={item.id} className="item-carrinho">
                  <div className="info-produto-carrinho">
                    <div className="imagem-produto-mini">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div className="detalhes-item-carrinho">
                      <h3 className="nome-produto-carrinho">{item.nome}</h3>
                      {item.nome_variacao && (
                        <span className="variacao-produto-carrinho">{item.nome_variacao}</span>
                      )}
                      <span className="preco-produto-carrinho">{formatarPreco(item.preco)}</span>
                    </div>
                  </div>
                  
                  <div className="controles-quantidade">
                    <button 
                      onClick={() => handleAtualizarQuantidade(item.id, item.quantidade - 1)}
                      className="btn-quantidade"
                    >
                      -
                    </button>
                    <span className="quantidade-item">{item.quantidade}</span>
                    <button 
                      onClick={() => handleAtualizarQuantidade(item.id, item.quantidade + 1)}
                      className="btn-quantidade"
                    >
                      +
                    </button>
                  </div>
                  
                  <div className="acoes-item-carrinho">
                    <span className="subtotal-item-carrinho">{formatarPreco(item.preco * item.quantidade)}</span>
                    <button 
                      onClick={() => handleRemoverItem(item.id)}
                      className="botao-acao excluir"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
              
              <div className="controles-carrinho">
                <div className="aplicar-cupom">
                  <div className="campo-form">
                    <input
                      type="text"
                      placeholder="Código do cupom"
                      value={cupomCodigo}
                      onChange={(e) => setCupomCodigo(e.target.value.toUpperCase())}
                      className="input-form"
                    />
                  </div>
                  {carrinho.cupom_codigo ? (
                    <button onClick={handleRemoverCupom} className="btn btn-secundario">
                      Remover Cupom
                    </button>
                  ) : (
                    <button onClick={handleAplicarCupom} className="btn btn-primario">
                      Aplicar Cupom
                    </button>
                  )}
                </div>
                
                <div className="aplicar-frete">
                  <div className="campo-form">
                    <input
                      type="text"
                      placeholder="CEP (somente números)"
                      value={cep}
                      onChange={handleCepChange}
                      className="input-form"
                      maxLength={9}
                    />
                  </div>
                  <button onClick={handleBuscarCep} className="btn btn-primario">
                    Calcular Frete
                  </button>
                </div>
              </div>
            </div>
            
            <div className="resumo-carrinho">
              <h2 className="titulo-resumo">Resumo do Pedido</h2>
              
              <div className="detalhes-resumo">
                <div className="linha-resumo">
                  <span className="rotulo-resumo">Subtotal</span>
                  <span className="valor-resumo">{formatarPreco(carrinho.subtotal)}</span>
                </div>
                
                {carrinho.desconto > 0 && (
                  <div className="linha-resumo desconto">
                    <span className="rotulo-resumo">Desconto {carrinho.cupom_codigo && `(${carrinho.cupom_codigo})`}</span>
                    <span className="valor-resumo">- {formatarPreco(carrinho.desconto)}</span>
                  </div>
                )}
                
                <div className="linha-resumo">
                  <span className="rotulo-resumo">Frete</span>
                  <span className="valor-resumo">{carrinho.frete > 0 ? formatarPreco(carrinho.frete) : 'Calcule o CEP'}</span>
                </div>
                
                <div className="linha-resumo total">
                  <span className="rotulo-resumo">Total</span>
                  <span className="valor-resumo total">{formatarPreco(carrinho.total)}</span>
                </div>
              </div>
              
              <div className="acoes-resumo">
                <Link href="/produtos" className="btn btn-secundario">
                  Continuar Comprando
                </Link>
                <button
                  onClick={() => document.getElementById('checkout-form')?.scrollIntoView({ behavior: 'smooth' })}
                  className="btn btn-primario"
                >
                  Finalizar Compra
                </button>
              </div>
            </div>
          </div>
          
          <form 
            id="checkout-form" 
            onSubmit={handleFinalizarPedido}
            className="formulario-checkout"
          >
            <h2 className="titulo-secao">Informações para Entrega</h2>
            
            <div className="grid-formulario">
              <div className="campo-form">
                <label htmlFor="nome" className="rotulo-form">Nome Completo *</label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={checkoutData.nome}
                  onChange={handleCheckoutChange}
                  className={`input-form ${formErrors.nome ? 'erro' : ''}`}
                  placeholder="Seu nome completo"
                />
                {formErrors.nome && <p className="mensagem-erro">{formErrors.nome}</p>}
              </div>
              
              <div className="campo-form">
                <label htmlFor="email" className="rotulo-form">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={checkoutData.email}
                  onChange={handleCheckoutChange}
                  className={`input-form ${formErrors.email ? 'erro' : ''}`}
                  placeholder="seu.email@exemplo.com"
                />
                {formErrors.email && <p className="mensagem-erro">{formErrors.email}</p>}
              </div>
              
              <div className="campo-form">
                <label htmlFor="telefone" className="rotulo-form">Telefone *</label>
                <input
                  type="tel"
                  id="telefone"
                  name="telefone"
                  value={checkoutData.telefone}
                  onChange={handleCheckoutChange}
                  className={`input-form ${formErrors.telefone ? 'erro' : ''}`}
                  placeholder="(00) 00000-0000"
                />
                {formErrors.telefone && <p className="mensagem-erro">{formErrors.telefone}</p>}
              </div>
              
              <div className="campo-form">
                <label htmlFor="cep" className="rotulo-form">CEP *</label>
                <div className="campo-com-botao">
                  <input
                    type="text"
                    id="cep"
                    value={cep}
                    onChange={handleCepChange}
                    className={`input-form ${formErrors.cep ? 'erro' : ''}`}
                    placeholder="00000-000"
                    maxLength={9}
                  />
                  <button 
                    type="button" 
                    onClick={handleBuscarCep}
                    className="btn btn-secundario"
                  >
                    Buscar
                  </button>
                </div>
                {formErrors.cep && <p className="mensagem-erro">{formErrors.cep}</p>}
              </div>
              
              {endereco ? (
                <>
                  <div className="campo-form span-2">
                    <label className="rotulo-form">Endereço</label>
                    <p className="texto-info">
                      {endereco.logradouro}, {endereco.bairro} - {endereco.localidade}/{endereco.uf}
                    </p>
                  </div>
                  
                  <div className="campo-form">
                    <label htmlFor="numeroEndereco" className="rotulo-form">Número *</label>
                    <input
                      type="text"
                      id="numeroEndereco"
                      name="numeroEndereco"
                      value={checkoutData.numeroEndereco}
                      onChange={handleCheckoutChange}
                      className={`input-form ${formErrors.numeroEndereco ? 'erro' : ''}`}
                      placeholder="123"
                    />
                    {formErrors.numeroEndereco && <p className="mensagem-erro">{formErrors.numeroEndereco}</p>}
                  </div>
                  
                  <div className="campo-form">
                    <label htmlFor="complementoEndereco" className="rotulo-form">Complemento</label>
                    <input
                      type="text"
                      id="complementoEndereco"
                      name="complementoEndereco"
                      value={checkoutData.complementoEndereco}
                      onChange={handleCheckoutChange}
                      className="input-form"
                      placeholder="Apto, Bloco, Casa, etc."
                    />
                  </div>
                </>
              ) : (
                <div className="campo-form span-2">
                  <label htmlFor="enderecoCompleto" className="rotulo-form">Endereço Completo *</label>
                  <input
                    type="text"
                    id="enderecoCompleto"
                    name="enderecoCompleto"
                    value={checkoutData.enderecoCompleto}
                    onChange={handleCheckoutChange}
                    className={`input-form ${formErrors.enderecoCompleto ? 'erro' : ''}`}
                    placeholder="Rua, Número, Bairro, Cidade - UF"
                  />
                  {formErrors.enderecoCompleto && <p className="mensagem-erro">{formErrors.enderecoCompleto}</p>}
                </div>
              )}
              
              <div className="campo-form span-2">
                <label htmlFor="formaPagamento" className="rotulo-form">Forma de Pagamento *</label>
                <select
                  id="formaPagamento"
                  name="formaPagamento"
                  value={checkoutData.formaPagamento}
                  onChange={handleCheckoutChange}
                  className="input-form"
                >
                  <option value="cartao">Cartão de Crédito</option>
                  <option value="boleto">Boleto Bancário</option>
                  <option value="pix">PIX</option>
                </select>
              </div>
            </div>
            
            <div className="acoes-formulario">
              <button 
                type="submit" 
                className="btn btn-primario btn-grande"
                disabled={carrinho.frete === 0 || loading}
              >
                {loading ? (
                  <div className="spinner-pequeno"></div>
                ) : (
                  'Finalizar Pedido'
                )}
              </button>
              {carrinho.frete === 0 && (
                <p className="mensagem-info">
                  Por favor, calcule o frete antes de finalizar o pedido.
                </p>
              )}
            </div>
          </form>
        </>
      )}
    </div>
  );
} 