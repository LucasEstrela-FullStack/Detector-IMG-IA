import { useEffect, useState, type ChangeEvent, type DragEvent } from 'react'
import {
  ImageUpIcon,
  LoaderCircleIcon,
  RotateCcwIcon,
  ScanSearchIcon,
  TriangleAlertIcon,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress, ProgressLabel } from '@/components/ui/progress'
import { analisarImagem, type Previsao } from '@/lib/api'
import { cn } from '@/lib/utils'

type Dimensoes = { largura: number; altura: number }
type Erro = { titulo: string; mensagem: string }

export default function App() {
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [dimensoes, setDimensoes] = useState<Dimensoes | null>(null)
  const [arrastando, setArrastando] = useState(false)
  const [analisando, setAnalisando] = useState(false)
  const [previsao, setPrevisao] = useState<Previsao | null>(null)
  const [erro, setErro] = useState<Erro | null>(null)

  // Libera a URL temporária da pré-visualização anterior quando ela é trocada
  useEffect(() => {
    if (!preview) return
    return () => URL.revokeObjectURL(preview)
  }, [preview])

  function selecionar(novo: File | undefined) {
    if (!novo) return
    setPrevisao(null)
    setDimensoes(null)
    if (!novo.type.startsWith('image/')) {
      setArquivo(null)
      setPreview(null)
      setErro({
        titulo: 'Arquivo inválido',
        mensagem: `"${novo.name}" não é uma imagem. Envie um arquivo PNG, JPEG, WebP ou similar.`,
      })
      return
    }
    setErro(null)
    setArquivo(novo)
    setPreview(URL.createObjectURL(novo))
  }

  function aoEscolher(evento: ChangeEvent<HTMLInputElement>) {
    selecionar(evento.target.files?.[0])
    evento.target.value = ''
  }

  function aoSoltar(evento: DragEvent<HTMLLabelElement>) {
    evento.preventDefault()
    setArrastando(false)
    selecionar(evento.dataTransfer.files[0])
  }

  async function analisar() {
    if (!arquivo) return
    setAnalisando(true)
    setErro(null)
    setPrevisao(null)
    try {
      setPrevisao(await analisarImagem(arquivo))
    } catch (e) {
      setErro({
        titulo: 'Não foi possível analisar',
        mensagem: e instanceof Error ? e.message : 'Ocorreu um erro inesperado.',
      })
    } finally {
      setAnalisando(false)
    }
  }

  function recomecar() {
    setArquivo(null)
    setPreview(null)
    setDimensoes(null)
    setPrevisao(null)
    setErro(null)
  }

  const ehIA = previsao?.prediction === 'Imagem Gerada por IA'
  const confianca = previsao ? Math.round(previsao.confidence * 1000) / 10 : 0

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-xl">Detector de Imagem: IA ou Real</CardTitle>
          <CardDescription>
            Envie uma imagem para descobrir se ela é uma fotografia real ou foi gerada por
            inteligência artificial.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <input
            id="imageInput"
            type="file"
            accept="image/*"
            className="peer sr-only"
            onChange={aoEscolher}
            disabled={analisando}
          />
          <label
            htmlFor="imageInput"
            onDragOver={(e) => {
              e.preventDefault()
              setArrastando(true)
            }}
            onDragLeave={() => setArrastando(false)}
            onDrop={aoSoltar}
            className={cn(
              'flex min-h-56 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border-2 border-dashed p-4 text-center transition-colors',
              'hover:border-primary/50 hover:bg-muted/60 peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50',
              arrastando && 'border-primary bg-muted/60',
              analisando && 'pointer-events-none opacity-60',
            )}
          >
            {preview ? (
              <img
                src={preview}
                alt="Pré-visualização da imagem enviada"
                className="max-h-64 rounded-md object-contain"
                onLoad={(e) =>
                  setDimensoes({
                    largura: e.currentTarget.naturalWidth,
                    altura: e.currentTarget.naturalHeight,
                  })
                }
              />
            ) : (
              <>
                <ImageUpIcon className="size-10 text-muted-foreground" />
                <span className="font-medium">Arraste uma imagem ou clique para escolher</span>
                <span className="text-sm text-muted-foreground">PNG, JPEG, WebP, BMP ou GIF</span>
              </>
            )}
          </label>

          {arquivo && (
            <p className="truncate text-sm text-muted-foreground">
              {arquivo.name}
              {dimensoes && ` · ${dimensoes.largura}×${dimensoes.altura}`}
            </p>
          )}

          {erro && (
            <Alert variant="destructive">
              <TriangleAlertIcon />
              <AlertTitle>{erro.titulo}</AlertTitle>
              <AlertDescription>{erro.mensagem}</AlertDescription>
            </Alert>
          )}

          {previsao && (
            <div className="space-y-3 rounded-lg border p-4" aria-live="polite">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">Resultado</span>
                <Badge
                  className={cn(
                    ehIA
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                      : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
                  )}
                >
                  {ehIA ? 'IA' : 'Real'}
                </Badge>
              </div>
              <p className="text-2xl font-semibold">{previsao.prediction}</p>
              <Progress value={confianca}>
                <ProgressLabel>Confiança</ProgressLabel>
                <span className="ml-auto text-sm text-muted-foreground tabular-nums">
                  {confianca.toLocaleString('pt-BR')}%
                </span>
              </Progress>
            </div>
          )}

          <div className="flex gap-2">
            <Button className="flex-1" onClick={analisar} disabled={!arquivo || analisando}>
              {analisando ? <LoaderCircleIcon className="animate-spin" /> : <ScanSearchIcon />}
              {analisando ? 'Analisando...' : 'Analisar imagem'}
            </Button>
            {(arquivo || erro) && (
              <Button variant="outline" onClick={recomecar} disabled={analisando}>
                <RotateCcwIcon />
                Recomeçar
              </Button>
            )}
          </div>
        </CardContent>

        <CardFooter>
          <p className="text-xs text-muted-foreground">
            O modelo aprendeu com imagens pequenas, de 32×32 pixels, e nenhuma delas tinha rostos.
            Em fotos grandes, retratos ou imagens de geradores recentes, o resultado não é confiável.
          </p>
        </CardFooter>
      </Card>
    </main>
  )
}
