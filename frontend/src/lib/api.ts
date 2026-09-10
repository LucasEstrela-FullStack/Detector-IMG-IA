export type Previsao = {
  label: 'real' | 'fake'
  prediction: string
  confidence: number
}

export async function analisarImagem(arquivo: File): Promise<Previsao> {
  const corpo = new FormData()
  corpo.append('image', arquivo)

  let resposta: Response
  try {
    resposta = await fetch('/predict', { method: 'POST', body: corpo })
  } catch {
    // O fetch só falha sem resposta nenhuma: API fora do ar ou sem conexão
    throw new Error('Não foi possível conectar à API. Verifique se ela está rodando.')
  }
  const dados = await resposta.json().catch(() => null)

  if (!resposta.ok) {
    throw new Error(dados?.error ?? `O servidor respondeu com erro ${resposta.status}.`)
  }
  // Um 200 que não é previsão (página HTML, corpo vazio) deixaria a tela em branco
  if (!ehPrevisao(dados)) {
    throw new Error('O servidor devolveu uma resposta inesperada.')
  }
  return dados
}

function ehPrevisao(dados: unknown): dados is Previsao {
  if (typeof dados !== 'object' || dados === null) return false
  const { label, prediction, confidence } = dados as Record<string, unknown>
  return (
    (label === 'real' || label === 'fake') &&
    typeof prediction === 'string' &&
    typeof confidence === 'number'
  )
}
