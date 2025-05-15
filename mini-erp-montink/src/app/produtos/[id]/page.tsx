'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';

interface Variacao {
  id?: number;
  nome: string;
  estoque: number;
}

interface Produto {
  id?: number;
  nome: string;
  preco: number;
  estoque: number;
  variacoes: Variacao[];
}

export default function EditarProdutoPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  const isNovo = id === 'novo';
  const [loading, setLoading] = useState(!isNovo);
  const [saving, setSaving] = useState(false);
  
  const [produto, setProduto] = useState<Produto>({
    nome: '',
    preco: 0,
    estoque: 0,
    variacoes: []
  });

  useEffect(() => {
    if (!isNovo) {
      fetchProduto();
    }
  }, [id, isNovo]);

  async function fetchProduto() {
    try {
      const response = await fetch(`/api/produtos/${id}`);
      if (!response.ok) {
        throw new Error('Erro ao buscar produto');
      }
      
      const data = await response.json();
      
      setProduto({
        id: data.id,
        nome: data.nome,
        preco: data.preco,
        estoque: data.estoque || 0,
        variacoes: data.variacoes || []
      });
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar produto');
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProduto(prev => ({
      ...prev,
      [name]: name === 'preco' ? parseFloat(value) || 0 : value
    }));
  };

  const handleEstoqueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProduto(prev => ({
      ...prev,
      estoque: parseInt(e.target.value) || 0
    }));
  };

  const handleAddVariacao = () => {
    setProduto(prev => ({
      ...prev,
      variacoes: [...prev.variacoes, { nome: '', estoque: 0 }]
    }));
  };

  const handleRemoveVariacao = (index: number) => {
    setProduto(prev => ({
      ...prev,
      variacoes: prev.variacoes.filter((_, i) => i !== index)
    }));
  };

  const handleVariacaoChange = (index: number, field: 'nome' | 'estoque', value: string) => {
    setProduto(prev => {
      const variacoes = [...prev.variacoes];
      variacoes[index] = {
        ...variacoes[index],
        [field]: field === 'estoque' ? parseInt(value) || 0 : value
      };
      return { ...prev, variacoes };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Validações básicas
      if (!produto.nome.trim()) {
        toast.error('Nome do produto é obrigatório');
        setSaving(false);
        return;
      }

      if (produto.preco <= 0) {
        toast.error('Preço deve ser maior que zero');
        setSaving(false);
        return;
      }

      const payload = {
        nome: produto.nome,
        preco: produto.preco,
        estoque: produto.variacoes.length > 0 ? undefined : produto.estoque,
        variacoes: produto.variacoes.length > 0 ? produto.variacoes : undefined
      };

      const url = isNovo ? '/api/produtos' : `/api/produtos/${id}`;
      const method = isNovo ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao salvar produto');
      }

      toast.success(`Produto ${isNovo ? 'cadastrado' : 'atualizado'} com sucesso`);
      router.push('/produtos');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Erro ao salvar produto');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="carregando">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="pagina-produto">
      <div className="cabecalho-pagina">
        <h1 className="titulo-pagina">{isNovo ? 'Novo Produto' : 'Editar Produto'}</h1>
        <Link href="/produtos">
          <button className="btn btn-secundario">
            Voltar
          </button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="formulario-produto">
        <div className="campo-produto">
          <label className="rotulo-form" htmlFor="nome">
            Nome *
          </label>
          <input
            id="nome"
            name="nome"
            type="text"
            value={produto.nome}
            onChange={handleChange}
            className="input-form"
            required
          />
        </div>

        <div className="campo-produto">
          <label className="rotulo-form" htmlFor="preco">
            Preço (R$) *
          </label>
          <input
            id="preco"
            name="preco"
            type="number"
            step="0.01"
            min="0"
            value={produto.preco}
            onChange={handleChange}
            className="input-form"
            required
          />
        </div>

        {produto.variacoes.length === 0 && (
          <div className="campo-produto">
            <label className="rotulo-form" htmlFor="estoque">
              Estoque
            </label>
            <input
              id="estoque"
              name="estoque"
              type="number"
              min="0"
              value={produto.estoque}
              onChange={handleEstoqueChange}
              className="input-form"
            />
          </div>
        )}

        <div className="secao-variacoes">
          <div className="cabecalho-variacoes">
            <label className="titulo-variacoes">Variações</label>
            <button
              type="button"
              onClick={handleAddVariacao}
              className="btn btn-primario"
            >
              Adicionar Variação
            </button>
          </div>

          {produto.variacoes.length > 0 && (
            <div className="lista-variacoes">
              {produto.variacoes.map((variacao, index) => (
                <div key={index} className="item-variacao">
                  <div>
                    <input
                      type="text"
                      placeholder="Nome da variação"
                      value={variacao.nome}
                      onChange={(e) => handleVariacaoChange(index, 'nome', e.target.value)}
                      className="input-form"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Estoque"
                      min="0"
                      value={variacao.estoque}
                      onChange={(e) => handleVariacaoChange(index, 'estoque', e.target.value)}
                      className="input-form"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveVariacao(index)}
                    className="botao-remover"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="acoes-formulario">
          <button
            type="submit"
            className="btn btn-primario btn-grande"
            disabled={saving}
          >
            {saving ? (
              <div className="spinner-pequeno"></div>
            ) : (
              isNovo ? 'Cadastrar Produto' : 'Salvar Alterações'
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 