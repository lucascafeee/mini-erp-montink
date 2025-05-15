'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import EditarProdutoPage from '../[id]/page';

export default function NovoProdutoPage() {
  // Renderizar diretamente o componente de edição com id "novo"
  return <EditarProdutoPage params={{ id: 'novo' }} />;
} 