import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const cep = url.searchParams.get('cep');
    
    if (!cep) {
      return NextResponse.json(
        { error: 'CEP é obrigatório' },
        { status: 400 }
      );
    }
    
    // Remove caracteres não numéricos
    const cepNumerico = cep.replace(/\D/g, '');
    
    if (cepNumerico.length !== 8) {
      return NextResponse.json(
        { error: 'CEP inválido' },
        { status: 400 }
      );
    }
    
    // Consulta o ViaCEP
    const response = await fetch(`https://viacep.com.br/ws/${cepNumerico}/json/`);
    const data = await response.json();
    
    if (data.erro) {
      return NextResponse.json(
        { error: 'CEP não encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      cep: data.cep,
      logradouro: data.logradouro,
      complemento: data.complemento,
      bairro: data.bairro,
      localidade: data.localidade,
      uf: data.uf,
      ibge: data.ibge,
      gia: data.gia,
      ddd: data.ddd,
      siafi: data.siafi
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Erro ao consultar CEP' },
      { status: 500 }
    );
  }
} 