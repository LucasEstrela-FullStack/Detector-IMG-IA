# Imagem da API. A interface web tem imagem própria, em frontend/Dockerfile.
FROM python:3.12-slim

# Não gera .pyc e não bufferiza a saída, para os logs aparecerem na hora
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# O usuário é criado antes das cópias para que o COPY --chown ja grave o dono
# correto. Um chown -R posterior duplicaria a camada do modelo, custando 343 MB.
RUN useradd --create-home --shell /bin/bash detector

WORKDIR /app

# O torch padrão traz as bibliotecas CUDA e passa de 2 GB. Como a inferência
# aqui roda em CPU, o índice de CPU do PyTorch reduz o tamanho da imagem.
COPY requirements.txt .
RUN pip install --no-cache-dir \
        --index-url https://download.pytorch.org/whl/cpu \
        --extra-index-url https://pypi.org/simple \
        -r requirements.txt

COPY --chown=detector:detector app.py .
COPY --chown=detector:detector model/ model/

USER detector

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:5000/', timeout=4)"

# O timeout maior cobre o carregamento do modelo na inicialização do worker
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "1", "--timeout", "120", "app:app"]
