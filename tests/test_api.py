import io

import pytest

from conftest import imagem_em_bytes

ROTULOS = {"Imagem Real", "Imagem Gerada por IA"}
ROTULO_POR_CHAVE = {"real": "Imagem Real", "fake": "Imagem Gerada por IA"}


class TestStatus:
    def test_responde_200(self, cliente):
        assert cliente.get("/").status_code == 200

    def test_informa_status_e_endpoint(self, cliente):
        assert cliente.get("/").get_json() == {"status": "ok", "endpoint": "POST /predict"}


class TestPredictSucesso:
    def test_responde_200(self, cliente, imagem_png):
        r = cliente.post("/predict", data={"image": (imagem_png, "teste.png")},
                         content_type="multipart/form-data")
        assert r.status_code == 200

    def test_devolve_previsao_e_confianca(self, cliente, imagem_png):
        r = cliente.post("/predict", data={"image": (imagem_png, "teste.png")},
                         content_type="multipart/form-data")
        corpo = r.get_json()
        assert set(corpo) == {"label", "prediction", "confidence"}

    def test_rotulo_esta_em_portugues(self, cliente, imagem_png):
        r = cliente.post("/predict", data={"image": (imagem_png, "teste.png")},
                         content_type="multipart/form-data")
        assert r.get_json()["prediction"] in ROTULOS

    def test_chave_estavel_corresponde_ao_rotulo(self, cliente, imagem_png):
        corpo = cliente.post("/predict", data={"image": (imagem_png, "teste.png")},
                             content_type="multipart/form-data").get_json()
        assert corpo["label"] in ROTULO_POR_CHAVE
        assert corpo["prediction"] == ROTULO_POR_CHAVE[corpo["label"]]

    def test_confianca_e_probabilidade_valida(self, cliente, imagem_png):
        r = cliente.post("/predict", data={"image": (imagem_png, "teste.png")},
                         content_type="multipart/form-data")
        confianca = r.get_json()["confidence"]
        assert isinstance(confianca, float)
        assert 0.0 <= confianca <= 1.0

    @pytest.mark.parametrize("formato,nome", [
        ("PNG", "a.png"),
        ("JPEG", "a.jpg"),
        ("BMP", "a.bmp"),
        ("WEBP", "a.webp"),
    ])
    def test_aceita_formatos_comuns(self, cliente, formato, nome):
        img = imagem_em_bytes(formato=formato)
        r = cliente.post("/predict", data={"image": (img, nome)},
                         content_type="multipart/form-data")
        assert r.status_code == 200

    def test_aceita_imagem_grande(self, cliente):
        """Imagens de alta resolução são reduzidas a 32x32 antes da inferência."""
        img = imagem_em_bytes(tamanho=(2000, 1500), formato="JPEG")
        r = cliente.post("/predict", data={"image": (img, "grande.jpg")},
                         content_type="multipart/form-data")
        assert r.status_code == 200


class TestPredictErros:
    def test_requisicao_sem_arquivo(self, cliente):
        r = cliente.post("/predict", data={}, content_type="multipart/form-data")
        assert r.status_code == 400
        assert "error" in r.get_json()

    def test_arquivo_que_nao_e_imagem(self, cliente):
        arquivo = io.BytesIO(b"isto nao e uma imagem")
        r = cliente.post("/predict", data={"image": (arquivo, "a.txt")},
                         content_type="multipart/form-data")
        assert r.status_code == 500
        assert "error" in r.get_json()

    def test_arquivo_vazio(self, cliente):
        r = cliente.post("/predict", data={"image": (io.BytesIO(b""), "vazio.jpg")},
                         content_type="multipart/form-data")
        assert r.status_code == 500

    def test_metodo_get_nao_permitido(self, cliente):
        assert cliente.get("/predict").status_code == 405


class TestQualidadeDoModelo:
    """Verifica o comportamento do modelo no domínio em que foi treinado."""

    def _classifica(self, cliente, caminho):
        with open(caminho, "rb") as f:
            r = cliente.post("/predict", data={"image": (io.BytesIO(f.read()), caminho.name)},
                             content_type="multipart/form-data")
        return r.get_json()

    def test_reconhece_imagens_reais(self, cliente, dataset_teste):
        arquivos = sorted((dataset_teste / "REAL").iterdir())[:5]
        acertos = sum(self._classifica(cliente, p)["label"] == "real" for p in arquivos)
        assert acertos == len(arquivos)

    def test_reconhece_imagens_geradas(self, cliente, dataset_teste):
        arquivos = sorted((dataset_teste / "FAKE").iterdir())[:5]
        acertos = sum(self._classifica(cliente, p)["label"] == "fake" for p in arquivos)
        assert acertos == len(arquivos)

    def test_confianca_alta_dentro_do_dominio(self, cliente, dataset_teste):
        arquivo = sorted((dataset_teste / "REAL").iterdir())[0]
        assert self._classifica(cliente, arquivo)["confidence"] > 0.9
