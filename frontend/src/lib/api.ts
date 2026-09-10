export type Previsao = {
  label: 'real' | 'fake'
  prediction: string
  confidence: number
}

export async function analisarImagem(arquivo: File): Promise<Previsao> {
  const corpo = new FormData()
  corpo.append('image', arquivo)

  const resposta = await fetch('/predict', { method: 'POST', body: corpo })
  const dados = await resposta.json().catch(() => null)

  if (!resposta.ok) {
    throw new Error(dados?.error ?? `O servidor respondeu com erro ${resposta.status}.`)
  }
  return dados as Previsao
}
