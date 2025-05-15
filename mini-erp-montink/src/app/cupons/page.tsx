'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

interface Cupom {
  id: number;
  codigo: string;
  desconto: number;
  tipo_desconto: 'percentual' | 'fixo';
  valor_minimo: number | null;
  data_inicio: string;
  data_fim: string;
}

export default function CuponsPage() {
  const [cupons, setCupons] = useState<Cupom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    codigo: '',
    desconto: '',
    tipo_desconto: 'percentual',
    valor_minimo: '',
    data_inicio: '',
    data_fim: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  useEffect(() => {
    fetchCupons();
  }, []);

  async function fetchCupons() {
    try {
      const response = await fetch('/api/cupons');
      if (!response.ok) {
        throw new Error('Erro ao buscar cupons');
      }
      const data = await response.json();
      setCupons(data);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar cupons');
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Limpa o erro quando o usuário digita
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: '',
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    const errors: Record<string, string> = {};
    
    if (!formData.codigo.trim()) {
      errors.codigo = 'Código é obrigatório';
    }
    
    if (!formData.desconto) {
      errors.desconto = 'Desconto é obrigatório';
    } else if (isNaN(Number(formData.desconto)) || Number(formData.desconto) <= 0) {
      errors.desconto = 'Desconto deve ser um valor positivo';
    } else if (formData.tipo_desconto === 'percentual' && Number(formData.desconto) > 100) {
      errors.desconto = 'Desconto percentual não pode ser maior que 100%';
    }
    
    if (formData.valor_minimo && (isNaN(Number(formData.valor_minimo)) || Number(formData.valor_minimo) < 0)) {
      errors.valor_minimo = 'Valor mínimo deve ser positivo';
    }
    
    if (!formData.data_inicio) {
      errors.data_inicio = 'Data de início é obrigatória';
    }
    
    if (!formData.data_fim) {
      errors.data_fim = 'Data de fim é obrigatória';
    } else if (formData.data_fim < formData.data_inicio) {
      errors.data_fim = 'Data de fim não pode ser anterior à data de início';
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    try {
      const payload = {
        codigo: formData.codigo,
        desconto: Number(formData.desconto),
        tipo_desconto: formData.tipo_desconto,
        valor_minimo: formData.valor_minimo ? Number(formData.valor_minimo) : null,
        data_inicio: formData.data_inicio,
        data_fim: formData.data_fim,
      };
      
      const response = await fetch('/api/cupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar cupom');
      }
      
      await fetchCupons();
      setShowForm(false);
      resetForm();
      toast.success('Cupom criado com sucesso!');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Erro ao criar cupom');
    }
  }

  function resetForm() {
    setFormData({
      codigo: '',
      desconto: '',
      tipo_desconto: 'percentual',
      valor_minimo: '',
      data_inicio: '',
      data_fim: '',
    });
    setFormErrors({});
  }

  function formatarPreco(preco: number | null) {
    if (preco === null) return '-';
    return preco.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  function formatarData(dataString: string) {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
  }

  function estaAtivo(cupom: Cupom) {
    const hoje = new Date();
    const dataInicio = new Date(cupom.data_inicio);
    const dataFim = new Date(cupom.data_fim);
    return hoje >= dataInicio && hoje <= dataFim;
  }

  return (
    <div className="pagina-cupons">
      <div className="cabecalho-pagina">
        <h1 className="titulo-pagina">
          Cupons
        </h1>
        
        <button 
          onClick={() => {
            setShowForm(!showForm);
            if (!showForm) resetForm();
          }}
          className={`btn ${showForm ? 'btn-secundario' : 'btn-primario'}`}
        >
          {showForm ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Cancelar
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Novo Cupom
            </>
          )}
        </button>
      </div>

      {showForm && (
        <div className="formulario-cupom">
          <h2 className="titulo-form">Cadastrar Novo Cupom</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="grid-form">
              <div className="campo-form">
                <label htmlFor="codigo" className="label-form">
                  Código*
                </label>
                <input
                  type="text"
                  id="codigo"
                  name="codigo"
                  value={formData.codigo}
                  onChange={handleChange}
                  className={`input-form ${formErrors.codigo ? 'input-erro' : ''}`}
                  placeholder="Ex: VERAO2023"
                />
                {formErrors.codigo && (
                  <p className="mensagem-erro">{formErrors.codigo}</p>
                )}
              </div>

              <div className="grid-2-colunas">
                <div className="campo-form">
                  <label htmlFor="desconto" className="label-form">
                    Desconto*
                  </label>
                  <input
                    type="text"
                    id="desconto"
                    name="desconto"
                    value={formData.desconto}
                    onChange={handleChange}
                    className={`input-form ${formErrors.desconto ? 'input-erro' : ''}`}
                    placeholder={formData.tipo_desconto === 'percentual' ? 'Ex: 10' : 'Ex: 50,00'}
                  />
                  {formErrors.desconto && (
                    <p className="mensagem-erro">{formErrors.desconto}</p>
                  )}
                </div>
                
                <div className="campo-form">
                  <label htmlFor="tipo_desconto" className="label-form">
                    Tipo*
                  </label>
                  <select
                    id="tipo_desconto"
                    name="tipo_desconto"
                    value={formData.tipo_desconto}
                    onChange={handleChange}
                    className="select-form"
                  >
                    <option value="percentual">Percentual (%)</option>
                    <option value="fixo">Valor Fixo (R$)</option>
                  </select>
                </div>
              </div>

              <div className="campo-form">
                <label htmlFor="valor_minimo" className="label-form">
                  Valor Mínimo da Compra
                </label>
                <input
                  type="text"
                  id="valor_minimo"
                  name="valor_minimo"
                  value={formData.valor_minimo}
                  onChange={handleChange}
                  className={`input-form ${formErrors.valor_minimo ? 'input-erro' : ''}`}
                  placeholder="Ex: 100,00 (opcional)"
                />
                {formErrors.valor_minimo && (
                  <p className="mensagem-erro">{formErrors.valor_minimo}</p>
                )}
              </div>

              <div className="grid-2-colunas">
                <div className="campo-form">
                  <label htmlFor="data_inicio" className="label-form">
                    Data de Início*
                  </label>
                  <input
                    type="date"
                    id="data_inicio"
                    name="data_inicio"
                    value={formData.data_inicio}
                    onChange={handleChange}
                    className={`input-form ${formErrors.data_inicio ? 'input-erro' : ''}`}
                  />
                  {formErrors.data_inicio && (
                    <p className="mensagem-erro">{formErrors.data_inicio}</p>
                  )}
                </div>
                
                <div className="campo-form">
                  <label htmlFor="data_fim" className="label-form">
                    Data de Fim*
                  </label>
                  <input
                    type="date"
                    id="data_fim"
                    name="data_fim"
                    value={formData.data_fim}
                    onChange={handleChange}
                    className={`input-form ${formErrors.data_fim ? 'input-erro' : ''}`}
                  />
                  {formErrors.data_fim && (
                    <p className="mensagem-erro">{formErrors.data_fim}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="acoes-form">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="btn btn-secundario"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primario"
              >
                Salvar Cupom
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="carregando">
          <div className="spinner"></div>
        </div>
      ) : cupons.length === 0 ? (
        <div className="sem-resultados">
          <svg xmlns="http://www.w3.org/2000/svg" className="icone-sem-resultados" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
          <p className="mensagem-sem-resultados">Nenhum cupom cadastrado</p>
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primario"
          >
            Criar Primeiro Cupom
          </button>
        </div>
      ) : (
        <div className="tabela-container">
          <table className="tabela">
            <thead className="tabela-cabecalho">
              <tr>
                <th>Código</th>
                <th>Desconto</th>
                <th>Valor Mínimo</th>
                <th>Validade</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody className="tabela-corpo">
              {cupons.map((cupom) => (
                <tr key={cupom.id} className="tabela-linha">
                  <td className="codigo-cupom">{cupom.codigo}</td>
                  <td>
                    {cupom.tipo_desconto === 'percentual'
                      ? `${cupom.desconto}%`
                      : formatarPreco(cupom.desconto)
                    }
                  </td>
                  <td>{formatarPreco(cupom.valor_minimo)}</td>
                  <td>
                    <div className="datas-validade">
                      <span>De: {formatarData(cupom.data_inicio)}</span>
                      <span>Até: {formatarData(cupom.data_fim)}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${estaAtivo(cupom) ? 'estoque' : 'sem-estoque'}`}>
                      {estaAtivo(cupom) ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td>
                    <div className="acoes-tabela">
                      <button
                        className="botao-acao editar"
                        title="Editar"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        className="botao-acao excluir"
                        title="Excluir"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 