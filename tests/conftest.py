import io
import sys
from pathlib import Path

import pytest
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ))


@pytest.fixture(scope="session")
def cliente():
    """Cliente de teste do Flask. O modelo é carregado uma única vez por sessão."""
    from app import app

    app.config["TESTING"] = True
    with app.test_client() as c:
        yield c


def imagem_em_bytes(tamanho=(64, 64), cor=(120, 80, 200), formato="PNG"):
    buffer = io.BytesIO()
    Image.new("RGB", tamanho, cor).save(buffer, format=formato)
    buffer.seek(0)
    return buffer


@pytest.fixture
def imagem_png():
    return imagem_em_bytes()


@pytest.fixture
def dataset_teste():
    """Caminho do CIFAKE de teste, quando disponível localmente."""
    caminho = RAIZ / "dataset" / "test"
    if not caminho.is_dir():
        pytest.skip("dataset/test não está presente neste ambiente")
    return caminho
