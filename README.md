# 🖼️ Imagem IA ou Imagem Real? — Detecção de Imagem DeepFake com Vision Transformers

Sistema de detecção de imagens geradas por IA, construído de ponta a ponta com **Python, Flask, Hugging Face Transformers, Vision Transformers (ViT) e deep learning**. A aplicação analisa imagens enviadas e prevê se são **geradas por IA (DeepFake)** ou **reais**, ajudando a identificar mídia sintética criada por modelos generativos.

---

# 📖 Visão geral do projeto

Com o avanço acelerado das tecnologias de IA generativa, distinguir imagens geradas por IA de fotografias autênticas ficou cada vez mais difícil. Imagens DeepFake podem ser usadas para desinformação, fraude de identidade e manipulação digital, o que torna as técnicas de detecção cada vez mais importantes.

O projeto usa um modelo **Vision Transformer (ViT)** para classificar as imagens enviadas como:

* 🟢 **Imagem Real**
* 🔴 **Imagem Gerada por IA / DeepFake**

O usuário envia uma imagem pela interface web e recebe a previsão do modelo na hora.

---

# ⚠️ Escopo e limitações

O modelo foi treinado no **CIFAKE**, um conjunto derivado do CIFAR-10 cujas imagens são nativamente de **32×32 pixels**, com categorias genéricas (aviões, carros, pássaros, gatos). O conjunto não contém rostos humanos nem imagens de modelos de difusão modernos.

Na prática:

* **Funciona bem** em imagens de baixa resolução, no mesmo domínio do CIFAKE.
* **Não é confiável** para fotos em alta resolução, rostos ou imagens do Midjourney, DALL·E e Stable Diffusion. Toda imagem enviada é reduzida a 32×32 antes da inferência, então uma foto de 4000×3000 é avaliada a partir de apenas 1024 pixels.

O percentual de confiança reflete a certeza do modelo dentro do domínio em que foi treinado, e não garante que a resposta esteja correta fora dele.

---

# ✨ Características

* 🖼️ Detecção de imagens geradas por IA (DeepFake)
* 📤 Envio de imagens por uma interface web simples
* 🤖 Classificação baseada em Vision Transformer (ViT)
* ⚡ Inferência rápida
* 🌐 Aplicação web em Flask
* 💻 Configuração local fácil
* ☁️ Pronta para deploy em nuvem

---

# 🏗️ Fluxo de detecção

```text
           Envio da imagem
                  │
                  ▼
          Pré-processamento
       (redimensiona para 32×32,
        normaliza e leva a 224×224)
                  │
                  ▼
       Vision Transformer (ViT)
                  │
                  ▼
        Inferência do modelo
                  │
                  ▼
   Imagem Real / Imagem Gerada por IA
```

---

# 🛠️ Pilha de tecnologia

## Backend

* Python
* Flask
* NumPy
* Pillow (PIL)

## Inteligência artificial

* Vision Transformers (ViT)
* Hugging Face Transformers
* PyTorch
* Deep learning

## Frontend

* HTML5
* CSS3
* JavaScript

---

# 📂 Estrutura do projeto

```text
Ai-ModelDeepFake/
│
├── app.py                 # API Flask e endpoint de inferência
├── model/                 # Pesos do modelo treinado
├── dataset/               # CIFAKE (train/test, FAKE/REAL)
├── notebook/              # Notebook de treino e avaliação
├── templates/index.html   # Interface web
├── static/                # Recursos estáticos
├── requirements.txt       # Dependências de execução
├── requirements-dev.txt   # Dependências de treino, notebook e testes
├── tests/                 # Testes automatizados da API
└── Procfile               # Configuração de deploy (gunicorn)
```

---

# ⚙️ Instalação

### Pré-requisitos

* **Python 3.10 ou superior** (o projeto foi validado no 3.14)
* Cerca de **3 GB livres em disco** — só o PyTorch ocupa mais de 2 GB
* Os pesos do modelo em `model/ai_vs_real_image_detection/`, com o `model.safetensors` de 328 MB

Confirme a versão do Python antes de começar:

```bash
python --version
```

### 1. Abra a pasta do projeto

```bash
cd "C:\caminho\para\Ai-ModelDeepFake"
```

### 2. Crie o ambiente virtual

```bash
python -m venv .venv
```

### 3. Ative o ambiente

O comando muda conforme o terminal usado:

| Terminal | Comando |
|---|---|
| PowerShell | `.venv\Scripts\Activate.ps1` |
| Prompt de Comando (cmd) | `.venv\Scripts\activate.bat` |
| Git Bash | `source .venv/Scripts/activate` |
| Linux / macOS | `source .venv/bin/activate` |

Deu certo quando aparece `(.venv)` no início da linha do terminal.

> Se o PowerShell recusar o script com erro de política de execução, rode uma vez:
> `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`

### 4. Instale as dependências

As dependências estão separadas em dois arquivos. Para **apenas usar o detector**:

```bash
pip install -r requirements.txt
```

Para **também treinar o modelo** e rodar o notebook:

```bash
pip install -r requirements-dev.txt
```

O arquivo de desenvolvimento já inclui o de execução, então não é preciso instalar os dois.

O download passa de 2 GB por causa do PyTorch, então a primeira instalação demora.

---

# ▶️ Como rodar no PC

Com o ambiente ativado, na raiz do projeto:

```bash
python app.py
```

Você verá no terminal:

```text
INFO:root:Modelo e processador carregados com sucesso!
 * Running on http://127.0.0.1:5000
```

Abra o navegador em **<http://localhost:5000>**, escolha uma imagem e clique em **Detectar se é IA ou Real**.

Pontos que costumam gerar dúvida:

* A primeira inicialização leva de **20 a 30 segundos**, porque carrega os 328 MB do modelo na memória. As previsões seguintes são rápidas.
* **Abra sempre pelo endereço `http://localhost:5000`.** Clicar duas vezes no arquivo `templates/index.html` mostra a mesma tela, mas o envio falha: sem o servidor, não há para onde mandar a imagem.
* Para encerrar, pressione **Ctrl+C** no terminal onde o servidor está rodando.
* Na inicialização aparece um aviso dizendo que o `torchvision` não está instalado e que será usado o processador de imagens do Pillow. **É apenas um aviso**, e a aplicação funciona normalmente — o `torchvision` faz parte das dependências de desenvolvimento.

### Sem ativar o ambiente

Se preferir não ativar o venv, chame o Python dele diretamente:

```bash
.venv\Scripts\python.exe app.py
```

---

# 🧪 Testes

A suíte cobre a API de ponta a ponta, usando o cliente de teste do Flask — não é preciso subir o servidor.

```bash
pip install -r requirements-dev.txt
pytest
```

São 18 testes divididos em quatro grupos: entrega da interface, respostas de sucesso do `/predict` (formatos de arquivo, rótulos em português, faixa da confiança), tratamento de erros (sem arquivo, arquivo inválido, arquivo vazio, método incorreto) e qualidade do modelo dentro do domínio do CIFAKE.

Os testes de qualidade dependem do dataset em `dataset/test/`. Quando ele não está presente, são ignorados automaticamente em vez de falhar.

O modelo é carregado uma única vez por sessão, então a suíte leva cerca de 17 segundos.

---

# 🧰 Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `Address already in use` na porta 5000 | Já existe um servidor rodando | Feche o outro terminal, ou troque a porta em `app.py` |
| A página abre, mas o envio dá erro | A interface foi aberta como arquivo local | Acesse por `http://localhost:5000` |
| `RuntimeError: Falha ao carregar o modelo` | Pesos ausentes ou incompletos | Verifique se `model/ai_vs_real_image_detection/model.safetensors` existe e tem 328 MB |
| `ModuleNotFoundError` | Ambiente virtual não ativado | Repita o passo 3 e confirme o `(.venv)` no terminal |
| `python` não é reconhecido | Python fora do PATH | Reinstale marcando "Add Python to PATH", ou use `py` no lugar de `python` |

---

# 🚀 Execução em produção

```bash
gunicorn app:app
```

O `gunicorn` não roda no Windows. Nesse caso, use o `waitress`:

```bash
pip install waitress
waitress-serve --port=5000 app:app
```

---

# 🔌 API

### `POST /predict`

Recebe uma imagem via `multipart/form-data` no campo `image`.

**Resposta (200):**

```json
{
  "prediction": "Imagem Real",
  "confidence": 0.9812
}
```

**Erros:** `400` quando não há arquivo na requisição, `500` quando a imagem não pôde ser processada.

---

# 🧪 Treino

O notebook em `notebook/` documenta o ajuste fino do ViT sobre o CIFAKE.

Requer as dependências de desenvolvimento (`pip install -r requirements-dev.txt`). Os caminhos internos são relativos à pasta `notebook/`, então **abra o Jupyter a partir dela**:

```bash
cd notebook
jupyter notebook
```

O treino exige o dataset em `dataset/`, com a estrutura `train/FAKE`, `train/REAL`, `test/FAKE` e `test/REAL`. Sem GPU, o processo leva várias horas.

Dois pontos antes de reproduzir ou citar os resultados:

1. O notebook foi escrito para a linha 4.x do `transformers`. As chamadas `TrainingArguments(evaluation_strategy=...)` e `Trainer(tokenizer=...)` foram renomeadas ou removidas na 5.x e precisam de ajuste.
2. O notebook junta as pastas `train` e `test` do CIFAKE e refaz um split aleatório 60/40, descartando a divisão canônica. Como o modelo base já havia sido treinado no CIFAKE, a acurácia registrada (98,24%) provavelmente está superestimada. Para uma medição confiável, avalie contra `dataset/test/` sem reaproveitá-lo no treino.

---

# 🔮 Melhorias futuras

* Retreino com dataset de alta resolução, ampliando o uso para além do CIFAKE
* Validação de tipo e tamanho de arquivo no upload (`MAX_CONTENT_LENGTH`)
* Visualizações de IA explicável (Grad-CAM ou mapas de atenção)
* Suporte a múltiplos modelos de geração de imagem
* Classificação em lote
* Containerização com Docker
* Deploy em nuvem (AWS, Azure, GCP)
* Testes automatizados e endpoint de health check

---

# 🤝 Contribuições

Contribuições, sugestões de funcionalidades e melhorias são bem-vindas. Sinta-se à vontade para fazer um fork do repositório e abrir um Pull Request.

---

# 📄 Licença

Projeto destinado a fins educacionais, de pesquisa e aprendizado. Não deve ser utilizado como método único de verificação de autenticidade de imagens em aplicações legais, forenses ou críticas de segurança.
