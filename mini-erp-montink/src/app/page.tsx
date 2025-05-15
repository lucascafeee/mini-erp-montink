import Link from 'next/link';

export default function Home() {
  return (
    <div className="homepage-wrapper">
      {/* Hero Section */}
      <section className="hero-section">
        <h1 className="hero-title">
          Sistema de Gerenciamento Mini ERP
        </h1>
        <p className="hero-subtitle">
          Gerencie produtos, pedidos, estoque e cupons de forma simples e eficiente com nossa plataforma completa e integrada.
        </p>
      </section>
      
      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-card stat-card-produtos">
            <div className="stat-value">428</div>
            <div className="stat-label">Produtos</div>
            <div className="stat-description">Total em estoque</div>
          </div>
          
          <div className="stat-card stat-card-pedidos">
            <div className="stat-value">184</div>
            <div className="stat-label">Pedidos</div>
            <div className="stat-description">Este mês</div>
          </div>
          
          <div className="stat-card stat-card-cupons">
            <div className="stat-value">32</div>
            <div className="stat-label">Cupons</div>
            <div className="stat-description">Ativos</div>
          </div>
          
          <div className="stat-card stat-card-faturamento">
            <div className="stat-value">R$26.4k</div>
            <div className="stat-label">Faturamento</div>
            <div className="stat-description">Últimos 30 dias</div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="features-section">
        <h2 className="section-title">Principais Funcionalidades</h2>
        
        <div className="features-grid">
          <Link href="/produtos" className="feature-link">
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg" className="feature-icon feature-icon-produtos" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="feature-title">Produtos</h3>
              <p className="feature-description">Gerencie seu catálogo com suporte a variações e estoque.</p>
              <div className="feature-action">
                Ver produtos
                <svg xmlns="http://www.w3.org/2000/svg" className="action-arrow" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </Link>
          
          <Link href="/cupons" className="feature-link">
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg" className="feature-icon feature-icon-cupons" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
              <h3 className="feature-title">Cupons</h3>
              <p className="feature-description">Crie cupons com regras de desconto, validade e valor mínimo.</p>
              <div className="feature-action">
                Ver cupons
                <svg xmlns="http://www.w3.org/2000/svg" className="action-arrow" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </Link>
          
          <Link href="/pedidos" className="feature-link">
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg" className="feature-icon feature-icon-pedidos" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="feature-title">Pedidos</h3>
              <p className="feature-description">Acompanhe pedidos e gerencie status de processamento.</p>
              <div className="feature-action">
                Ver pedidos
                <svg xmlns="http://www.w3.org/2000/svg" className="action-arrow" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </Link>
          
          <Link href="/carrinho" className="feature-link">
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg" className="feature-icon feature-icon-carrinho" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="feature-title">Carrinho</h3>
              <p className="feature-description">Gerenciar itens, aplicar cupons e finalizar compras.</p>
              <div className="feature-action">
                Ver carrinho
                <svg xmlns="http://www.w3.org/2000/svg" className="action-arrow" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </Link>
        </div>
      </section>
      
      {/* Info Section */}
      <section className="info-section">
        <h2 className="section-title info-section-title">Recursos do Sistema</h2>
        
        <div className="info-grid">
          <div className="info-list">
            <div className="info-list-item">
              <div className="info-bullet">
                <svg xmlns="http://www.w3.org/2000/svg" className="info-bullet-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span>Gerenciamento de produtos com variações</span>
            </div>
            
            <div className="info-list-item">
              <div className="info-bullet">
                <svg xmlns="http://www.w3.org/2000/svg" className="info-bullet-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span>Controle automático de estoque</span>
            </div>
            
            <div className="info-list-item">
              <div className="info-bullet">
                <svg xmlns="http://www.w3.org/2000/svg" className="info-bullet-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span>Sistema de cupons com regras de validade</span>
            </div>
          </div>
          
          <div className="info-list">
            <div className="info-list-item">
              <div className="info-bullet">
                <svg xmlns="http://www.w3.org/2000/svg" className="info-bullet-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span>Cálculo automático de frete por valor da compra</span>
            </div>
            
            <div className="info-list-item">
              <div className="info-bullet">
                <svg xmlns="http://www.w3.org/2000/svg" className="info-bullet-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span>Integração com API de consulta de CEP</span>
            </div>
            
            <div className="info-list-item">
              <div className="info-bullet">
                <svg xmlns="http://www.w3.org/2000/svg" className="info-bullet-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span>Webhook para atualização de status de pedidos</span>
            </div>
          </div>
        </div>
        
        <div className="info-actions">
          <Link href="/produtos" className="btn btn-primario">
            Ver produtos
          </Link>
          <Link href="/carrinho" className="btn btn-secundario">
            Ir para o carrinho
          </Link>
        </div>
      </section>
    </div>
  );
}
