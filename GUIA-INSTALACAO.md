# Guia de instalação e configuração

Documento operacional: como colocar o projeto para funcionar, o que pode ser ajustado e o que fazer quando algo falha. Para entender **o que** o projeto é e suas limitações, veja o [README](README.md).

---

## 1. Requisitos

| Item | Mínimo | Observação |
|---|---|---|
| Python | 3.10 | Validado no 3.14.7 |
| Espaço em disco | 3 GB | O PyTorch sozinho passa de 2 GB |
| Memória RAM | 2 GB livres | O modelo ocupa cerca de 350 MB carregado |
| Git LFS | qualquer versão | **Obrigatório** — sem ele o modelo não é baixado |

Sistemas: Windows, Linux e macOS. Não é necessária GPU — a inferência roda em CPU.

Confira o que já está instalado:

```bash
python --version
git --version
git lfs version
```

---

## 2. Obter o projeto

O passo mais esquecido é o Git LFS. Os pesos do modelo têm 328 MB e são armazenados fora do histórico comum do Git.

**Instale o Git LFS antes de clonar:**

```bash
git lfs install
```

Depois clone normalmente:

```bash
git clone https://github.com/LucasEstrela-FullStack/detector-imagem-ia.git
cd detector-imagem-ia
```

### Se você clonou antes de instalar o LFS

O arquivo do modelo virá como um ponteiro de texto de 3 linhas, e a aplicação falhará ao iniciar. Corrija com:

```bash
git lfs install
git lfs pull
```

**Como saber se o modelo veio completo:** o arquivo `model/ai_vs_real_image_detection/model.safetensors` deve ter cerca de **328 MB**. Se tiver poucos bytes, é o ponteiro.

```bash
ls -lh model/ai_vs_real_image_detection/model.safetensors
```

---

## 3. Ambiente virtual

Isola as dependências do projeto do restante do sistema.

```bash
python -m venv .venv
```

A ativação muda conforme o terminal:

| Terminal | Comando |
|---|---|
| PowerShell | `.venv\Scripts\Activate.ps1` |
| Prompt de Comando (cmd) | `.venv\Scripts\activate.bat` |
| Git Bash | `source .venv/Scripts/activate` |
| Linux / macOS | `source .venv/bin/activate` |

Funcionou quando aparece `(.venv)` no início da linha.

### PowerShell bloqueando o script

Se aparecer erro de política de execução, autorize scripts locais uma única vez:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### Alternativa sem ativar

Todos os comandos funcionam chamando o Python do ambiente diretamente, sem ativação:

```bash
.venv\Scripts\python.exe app.py
```

---

## 4. Dependências

São dois arquivos, com propósitos distintos:

| Arquivo | Quando usar | O que traz |
|---|---|---|
| `requirements.txt` | Só usar o detector | Flask, transformers, torch, Pillow, numpy, gunicorn |
| `requirements-dev.txt` | Treinar ou rodar testes | Tudo acima, mais torchvision, jupyter, pytest, pandas, scikit-learn e demais ferramentas |

```bash
pip install -r requirements.txt
```

O arquivo de desenvolvimento já inclui o de execução via `-r`, então nunca é preciso instalar os dois.

A primeira instalação baixa mais de 2 GB por causa do PyTorch e pode levar vários minutos.

---

## 5. Verificar a instalação

Antes de subir a aplicação, confirme que tudo está no lugar:

```bash
pip install -r requirements-dev.txt
pytest
```

Os 18 testes devem passar em cerca de 16 segundos. Os testes que dependem do dataset são ignorados automaticamente quando ele não está presente — isso é esperado.

---

## 6. Configuração

O projeto não usa arquivo de configuração nem variáveis de ambiente. Os ajustes são feitos editando diretamente o `app.py`.

### Porta e endereço

Última linha do [`app.py`](app.py):

```python
app.run(host='0.0.0.0', port=5000, debug=False)
```

* **`port`** — troque se a 5000 estiver ocupada.
* **`host`** — `0.0.0.0` aceita conexões de outras máquinas da rede. Use `127.0.0.1` para restringir à própria máquina.
* **`debug`** — mantenha `False`. Com `True`, o console do Werkzeug fica exposto e permite execução remota de código.

Essa linha só afeta a execução com `python app.py`. Em produção, quem define a porta é o gunicorn.

### Caminho do modelo

```python
model_dir = "./model/ai_vs_real_image_detection"
```

Aponte para outro diretório se você mantiver os pesos fora do projeto. O caminho é relativo à pasta de onde a aplicação é executada.

### Redimensionamento da entrada

```python
image = image.resize((32, 32))
```

**Não altere sem retreinar o modelo.** As imagens do CIFAKE são nativamente 32×32, e esse redimensionamento alinha a entrada ao domínio de treino. Aumentar o valor não melhora a precisão — apenas afasta a entrada daquilo que o modelo aprendeu.

---

## 7. Execução

### Desenvolvimento

```bash
python app.py
```

Acesse <http://localhost:5000>. A primeira inicialização leva de 20 a 30 segundos para carregar o modelo na memória; as previsões seguintes são rápidas.

### Produção em Linux e macOS

```bash
gunicorn --bind 0.0.0.0:5000 --workers 1 --timeout 120 app:app
```

O `--timeout 120` é necessário porque o worker carrega o modelo ao iniciar e o padrão de 30 segundos não é suficiente.

**Sobre o número de workers:** cada worker carrega sua própria cópia do modelo, consumindo cerca de 350 MB de RAM. Calcule a memória disponível antes de aumentar.

### Produção no Windows

O gunicorn **não funciona no Windows** — ele depende do módulo `fcntl`, exclusivo de sistemas Unix, e falha com `ModuleNotFoundError`. Use o waitress:

```bash
pip install waitress
waitress-serve --port=5000 app:app
```

---

## 8. Execução com Docker

Alternativa às seções 3 a 7: o container já traz Python, dependências e modelo. Não é preciso instalar Python nem criar ambiente virtual na sua máquina.

Requer o Docker instalado e **em execução** — no Windows e no macOS, o Docker Desktop precisa estar aberto.

### Subir

```bash
docker compose up --build
```

Acesse <http://localhost:5000>. A primeira construção baixa as dependências e leva vários minutos; as seguintes reaproveitam o cache.

### Encerrar

```bash
docker compose down
```

### Sem o Compose

```bash
docker build -t detector-imagem-ia .
docker run -d --name detector -p 5000:5000 detector-imagem-ia
```

### O que a imagem contém

| Item | Detalhe |
|---|---|
| Base | `python:3.12-slim` |
| PyTorch | Build de CPU (`2.14.0+cpu`), sem as bibliotecas CUDA |
| Servidor | gunicorn com 1 worker e timeout de 120 s |
| Usuário | `detector`, sem privilégios de root |
| Modelo | Incluído na imagem, 328 MB |

O `--timeout 120` é necessário porque o worker carrega o modelo ao iniciar, e o padrão de 30 segundos não é suficiente.

Ficam fora da imagem, pelo `.dockerignore`: o dataset, o ambiente virtual local, o notebook, os testes e os checkpoints de treino.

### Mudar a porta

Edite o mapeamento no [`docker-compose.yml`](docker-compose.yml). Para expor na 8080:

```yaml
ports:
  - "8080:5000"
```

O primeiro número é a porta na sua máquina; o segundo é a porta dentro do container, que não deve ser alterada.

### Verificar a saúde do container

A imagem define um healthcheck. Para consultar:

```bash
docker inspect --format "{{.State.Health.Status}}" detector
```

Retorna `starting` durante o carregamento do modelo e `healthy` quando a aplicação está respondendo.

### Ver os logs

```bash
docker compose logs -f
```

---

## 9. Solução de problemas

### `ModuleNotFoundError`

O ambiente virtual não está ativado, ou as dependências não foram instaladas. Confirme o `(.venv)` no terminal e reinstale.

### `RuntimeError: Falha ao carregar o modelo`

Quase sempre é o Git LFS. Verifique o tamanho do `model.safetensors` conforme a seção 2. Se for pequeno, rode `git lfs install` e `git lfs pull`.

### `Address already in use` na porta 5000

Outro processo está usando a porta. No Windows, para descobrir qual:

```powershell
Get-NetTCPConnection -LocalPort 5000 -State Listen | Select-Object OwningProcess
```

No Linux e macOS:

```bash
lsof -i :5000
```

Encerre o processo ou troque a porta conforme a seção 6.

### A página abre, mas o envio da imagem falha

A interface foi aberta como arquivo local, dando duplo clique em `templates/index.html`. A tela aparece igual, mas o JavaScript envia a imagem para `/predict`, que só existe no servidor. Acesse por `http://localhost:5000`.

### Aviso sobre o torchvision na inicialização

```
`ViTImageProcessor` requires torchvision (not installed);
falling back to `ViTImageProcessorPil`
```

É apenas um aviso. O `torchvision` faz parte das dependências de desenvolvimento e não é necessário para a aplicação funcionar.

### `python` não é reconhecido como comando

O Python não está no PATH. Reinstale marcando **"Add Python to PATH"**, ou use `py` no lugar de `python` no Windows.

### `Cannot connect to the Docker daemon`

O Docker está instalado mas não está em execução. Abra o Docker Desktop e aguarde ele terminar de iniciar.

### O build do Docker falha com erro de certificado SSL

```
CERTIFICATE_VERIFY_FAILED: self-signed certificate
```

Costuma ser instabilidade momentânea de rede — tente novamente antes de qualquer outra coisa. Se persistir, provavelmente há um proxy corporativo inspecionando o tráfego TLS, e o certificado da empresa precisa ser adicionado à imagem. **Não use `--trusted-host` como solução**: isso desativa a verificação de certificados e deixa a imagem vulnerável a interceptação.

### O container inicia mas o healthcheck fica em `starting`

Normal nos primeiros 90 segundos, enquanto o modelo é carregado. Se continuar assim depois disso, veja os logs com `docker compose logs -f`.

---

## 10. Remover a instalação

Todo o ambiente fica dentro da pasta do projeto. Para desinstalar, apague o diretório `.venv`:

```bash
rm -rf .venv
```

Nada é gravado fora da pasta do projeto, nem no registro do Windows.

Se você usou Docker, remova também o container e a imagem:

```bash
docker compose down
docker rmi detector-imagem-ia
```
