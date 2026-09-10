from flask import Flask, request, jsonify
from transformers import ViTImageProcessor, ViTForImageClassification
from PIL import Image
import torch
import logging

# Inicializa a aplicação Flask
app = Flask(__name__)

# Configura o log
logging.basicConfig(level=logging.INFO)

# Diretório do modelo e do processador
model_dir = "./model/ai_vs_real_image_detection"  # ajuste o caminho se necessário

try:
    # Carrega o modelo
    model = ViTForImageClassification.from_pretrained(
        model_dir,
        local_files_only=True
    )

    # Carrega o processador
    processor = ViTImageProcessor.from_pretrained(model_dir)

    logging.info("Modelo e processador carregados com sucesso!")

except Exception as e:
    logging.error(f"Erro ao carregar o modelo ou o processador: {e}")
    raise RuntimeError("Falha ao carregar o modelo ou o processador")

# Status da API; a interface web roda separada, na pasta frontend
@app.route('/')
def home():
    return jsonify({"status": "ok", "endpoint": "POST /predict"})

# Endpoint de previsão
@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Verifica se veio um arquivo de imagem na requisição
        if 'image' not in request.files:
            return jsonify({"error": "Nenhum arquivo de imagem encontrado na requisição"}), 400

        # Lê o arquivo enviado
        file = request.files['image']
        image = Image.open(file.stream).convert("RGB")

        # Redimensiona para 32x32, tamanho nativo das imagens do CIFAKE usadas no treino
        image = image.resize((32, 32))

        # Pré-processa a imagem
        inputs = processor(images=image, return_tensors="pt")

        # Executa a inferência
        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits
            predicted_class_id = logits.argmax(-1).item()

        # Converte o ID da classe no rótulo correspondente
        predicted_label = model.config.id2label[predicted_class_id]
        confidence = torch.softmax(logits, dim=-1)[0][predicted_class_id].item()

        # Chave estável ("real" ou "fake") para quem consome a API; o texto de exibição pode mudar
        label = predicted_label.lower()

        # Traduz os rótulos para exibição
        if predicted_label.lower() == "fake":
            predicted_label = "Imagem Gerada por IA"
        elif predicted_label.lower() == "real":
            predicted_label = "Imagem Real"

        logging.info(f"Previsão: {predicted_label}, Confiança: {confidence:.4f}")

        # Devolve o resultado em JSON
        return jsonify({
            "label": label,
            "prediction": predicted_label,
            "confidence": confidence
        })

    except Exception as e:
        logging.exception("Erro na previsão")
        return jsonify({"error": str(e)}), 500

# Sobe a aplicação Flask
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
