import React from 'react'
import jsPDF from 'jspdf'
import { useLocation } from 'react-router-dom'
import { CurrentPDFContext } from './CurrentPDF'

export const PaintManagerContext = React.createContext<PaintManagerContextType | undefined>(
  undefined
)

interface CurrentPDFProviderProps {
  children: React.ReactNode
}

interface Position {
  x: number
  y: number
}

interface PaintManagerContextType {
  ctx: CanvasRenderingContext2D | null
  redo: () => void
  undo: () => void
  draw: (e: React.MouseEvent<HTMLCanvasElement>) => void
  mode: Mode
  MODES: Record<string, Mode>
  setMode: React.Dispatch<React.SetStateAction<Mode>>
  canvasRef: React.RefObject<HTMLCanvasElement>
  lineWidth: number
  exportToPDF: () => void
  stopDrawing: (e: React.MouseEvent<HTMLCanvasElement>) => void
  clearCanvas: () => void
  startDrawing: (e: React.MouseEvent<HTMLCanvasElement>) => void
  selectedColor: string
  changeLineWidth: (newValue: string) => void
  changeLineColor: (color: string) => void
}

type Mode =
  | 'draw'
  | 'erase'
  | 'rectangle'
  | 'ellipse'
  | 'line'
  | 'picker'
  | 'text'
  | 'triangle'
  | 'heart'
  | 'bucket'

const MODES: Record<string, Mode> = {
  DRAW: 'draw',
  LINE: 'line',
  TEXT: 'text',
  ERASE: 'erase',
  HEART: 'heart',
  BUCKET: 'bucket',
  PICKER: 'picker',
  ELLIPSE: 'ellipse',
  TRIANGLE: 'triangle',
  RECTANGLE: 'rectangle',
}

const PaintManagerProvider: React.FC<CurrentPDFProviderProps> = ({ children }) => {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)

  const { pathname } = useLocation()
  const [ctx, setCtx] = React.useState<CanvasRenderingContext2D | null>(null)
  const [mode, setMode] = React.useState<Mode>(MODES.DRAW)
  const [lineWidth, setLineWidth] = React.useState<number>(2)
  const [isDrawing, setIsDrawing] = React.useState<boolean>(false)
  const [imageData, setImageData] = React.useState<ImageData | null>(null)
  const [undoStack, setUndoStack] = React.useState<ImageData[]>([])
  const [redoStack, setRedoStack] = React.useState<ImageData[]>([])
  const [lastPosition, setLastPosition] = React.useState<Position>({ x: 0, y: 0 })
  const [startPosition, setStartPosition] = React.useState<Position>({ x: 0, y: 0 })
  const [selectedColor, setSelectedColor] = React.useState<string>('')

  const currentPDFContext = React.useContext(CurrentPDFContext)
  if (!currentPDFContext) return

  const { pdfDocument } = currentPDFContext

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      const context = canvas.getContext('2d')
      setCtx(context)
      if (context) {
        context.lineJoin = 'round'
        context.lineCap = 'round'
        context.strokeStyle = '#000000'
        context.lineWidth = lineWidth
      }
    }
  }, [pathname])

  React.useEffect(() => {
    const loadCurrentPDF = async () => {
      if (pdfDocument == null) return

      const page = await pdfDocument.getPage(1) // Obtener la primera página
      const viewport = page.getViewport({ scale: 1.5 }) // Cambia la escala según tus necesidades

      const canvas = canvasRef.current
      if (canvas) {
        canvas.width = viewport.width
        canvas.height = viewport.height

        const ctx = canvas.getContext('2d')
        if (ctx) {
          setCtx(ctx) // Aquí se asegura que el contexto se establece correctamente
          const renderContext = {
            canvasContext: ctx,
            viewport,
          }

          await page.render(renderContext).promise // Renderiza la página

          // Configurar el contexto después de renderizar el PDF
          ctx.lineJoin = 'round'
          ctx.lineCap = 'round'
          ctx.strokeStyle = '#000000'
          ctx.lineWidth = 2
        }
      }
    }

    loadCurrentPDF()
  }, [pdfDocument])

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'z') {
        event.preventDefault() // Evitar el comportamiento predeterminado del navegador
        undo() // Ejecuta la función undo
      } else if (event.ctrlKey && event.key === 'y') {
        event.preventDefault() // Evitar el comportamiento predeterminado del navegador
        redo() // Ejecuta la función redo
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    // Limpia el event listener al desmontar el componente
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [undoStack, redoStack]) // Dependencias que podrían afectar el undo/redo

  const hexToRgba = (hex: string): number[] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16), 255]
      : [0, 0, 0, 255]
  }

  const getPixel = (imageData: ImageData, x: number, y: number): number[] => {
    if (x < 0 || y < 0 || x >= imageData.width || y >= imageData.height) {
      return [-1, -1, -1, -1] // impossible color
    } else {
      const offset = (y * imageData.width + x) * 4
      return Array.from(imageData.data.slice(offset, offset + 4))
    }
  }

  const setPixel = (imageData: ImageData, x: number, y: number, color: number[]) => {
    const offset = (y * imageData.width + x) * 4
    imageData.data[offset] = color[0]
    imageData.data[offset + 1] = color[1]
    imageData.data[offset + 2] = color[2]
    imageData.data[offset + 3] = color[3]
  }

  const colorsMatch = (a: number[], b: number[]): boolean => {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3]
  }

  const floodFill = (x: number, y: number, fillColor: string) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const targetColor = getPixel(imageData, x, y)

    if (colorsMatch(targetColor, hexToRgba(fillColor))) return

    const pixelsToCheck = [x, y]
    const fillColorRgba = hexToRgba(fillColor)

    while (pixelsToCheck.length > 0) {
      const y = pixelsToCheck.pop()!
      const x = pixelsToCheck.pop()!

      const currentColor = getPixel(imageData, x, y)
      if (colorsMatch(currentColor, targetColor) && !colorsMatch(currentColor, fillColorRgba)) {
        setPixel(imageData, x, y, fillColorRgba)

        if (x > 0) pixelsToCheck.push(x - 1, y)
        if (y > 0) pixelsToCheck.push(x, y - 1)
        if (x < canvas.width - 1) pixelsToCheck.push(x + 1, y)
        if (y < canvas.height - 1) pixelsToCheck.push(x, y + 1)
      }
    }

    ctx.putImageData(imageData, 0, 0)
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const { offsetX, offsetY } = e.nativeEvent

    if (!ctx) return

    if (mode === MODES.TEXT) {
      const inputText = prompt('Ingrese el texto:')
      if (!inputText) return

      ctx.fillStyle = ctx.strokeStyle // Usa el color actual del pincel
      ctx.font = '20px Arial' // Establece el estilo de fuente
      ctx.fillText(inputText, offsetX, offsetY) // Dibuja el texto en el canvas

      setIsDrawing(false) // Detén el dibujo
    }

    if (mode === MODES.LINE) {
      setLastPosition((prevPosition) => {
        if (prevPosition.x === 0 && prevPosition.y === 0) {
          return { x: offsetX, y: offsetY }
        }
        return prevPosition
      })
    }

    setStartPosition({ x: offsetX, y: offsetY })
    setImageData(ctx.getImageData(0, 0, canvasRef.current!.width, canvasRef.current!.height))
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !ctx) return
    const { offsetX, offsetY } = e.nativeEvent

    // Guardar el estado actual del canvas en undo stack antes de empezar un nuevo trazo
    if (ctx && canvasRef.current) {
      setUndoStack([
        ...undoStack,
        ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height),
      ])
      setRedoStack([]) // Limpiar el redo stack cuando se hace un nuevo trazo
    }

    if (mode === MODES.BUCKET) {
      floodFill(offsetX, offsetY, selectedColor)
    }

    if (mode === MODES.ERASE) {
      ctx.clearRect(
        offsetX - ctx.lineWidth / 2,
        offsetY - ctx.lineWidth / 2,
        ctx.lineWidth,
        ctx.lineWidth
      ) // Borra un área del tamaño de lineWidth
    }

    if (mode === MODES.DRAW) {
      ctx.beginPath()
      ctx.moveTo(startPosition.x, startPosition.y)
      ctx.lineTo(offsetX, offsetY)
      ctx.stroke()
      setStartPosition({ x: offsetX, y: offsetY })
    }

    if (mode === MODES.RECTANGLE) {
      ctx.putImageData(imageData!, 0, 0)
      let width = offsetX - startPosition.x
      let height = offsetY - startPosition.y

      ctx.beginPath()
      ctx.rect(startPosition.x, startPosition.y, width, height)
      ctx.stroke()
    }

    if (mode === MODES.HEART) {
      ctx.putImageData(imageData!, 0, 0)
      let width = offsetX - startPosition.x
      let height = offsetY - startPosition.y

      // Ajustar el tamaño según sea necesario
      let x = startPosition.x + width / 3
      let y = startPosition.y + height / 3

      let topCurveHeight = height * 0.2

      ctx.beginPath()
      ctx.moveTo(x, y + topCurveHeight)

      // Dibujar el lado izquierdo del corazón con curvas de Bézier
      ctx.bezierCurveTo(
        x - width / 2,
        y - topCurveHeight,
        x - width,
        y + topCurveHeight,
        x,
        y + height
      )

      // Dibujar el lado derecho del corazón con curvas de Bézier
      ctx.bezierCurveTo(
        x + width,
        y + topCurveHeight,
        x + width / 2,
        y - topCurveHeight,
        x,
        y + topCurveHeight
      )

      ctx.closePath()
      ctx.stroke()
    }

    if (mode === MODES.TRIANGLE) {
      ctx.putImageData(imageData!, 0, 0)
      let width = offsetX - startPosition.x
      let height = offsetY - startPosition.y

      // Calculamos el centro del área
      let centerX = startPosition.x + width / 2
      let centerY = startPosition.y + height / 2

      // Definimos el tamaño deseado del triángulo (ajusta según necesites)
      let triangleWidth = width * 0.8 // 80% del ancho total, por ejemplo
      let triangleHeight = height * 0.8

      ctx.beginPath()
      // Vértice superior
      ctx.moveTo(centerX, centerY - triangleHeight / 2)
      // Vértice inferior izquierdo
      ctx.lineTo(centerX - triangleWidth / 2, centerY + triangleHeight / 2)
      // Vértice inferior derecho
      ctx.lineTo(centerX + triangleWidth / 2, centerY + triangleHeight / 2)
      ctx.closePath()
      ctx.stroke()
    }

    if (mode === MODES.ELLIPSE) {
      ctx.putImageData(imageData!, 0, 0)
      let radiusX = (offsetX - startPosition.x) / 2
      let radiusY = (offsetY - startPosition.y) / 2
      let centerX = startPosition.x + radiusX
      let centerY = startPosition.y + radiusY

      ctx.beginPath()
      ctx.ellipse(centerX, centerY, Math.abs(radiusX), Math.abs(radiusY), 0, 0, Math.PI * 2)
      ctx.stroke()
    }

    if (mode === MODES.TEXT) {
      // Mostrar un prompt para ingresar el texto
      const inputText = prompt('Ingrese el texto:')
      if (inputText) {
        if (ctx) {
          ctx.fillStyle = ctx.strokeStyle // Usa el color actual del pincel
          ctx.font = '20px Arial' // Establece el estilo de fuente
          ctx.fillText(inputText, offsetX, offsetY) // Dibuja el texto en el canvas
        }
      }
      setIsDrawing(false) // Detén el dibujo
    }

    if (mode === MODES.LINE) {
      ctx.putImageData(imageData!, 0, 0)
      ctx.beginPath()
      ctx.moveTo(lastPosition.x, lastPosition.y)
      ctx.lineTo(offsetX, offsetY)
      ctx.stroke()
    }
  }

  const stopDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDrawing && mode === MODES.LINE && ctx) {
      const { offsetX, offsetY } = e.nativeEvent
      setLastPosition({ x: offsetX, y: offsetY })
    }
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      setUndoStack([]) // Limpiar las pilas
      setRedoStack([])
    }
  }

  const exportToPDF = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const imgData = canvas.toDataURL('image/png') // Obtiene la imagen del canvas
    const pdf = new jsPDF('p', 'pt', 'a4') // Crear un nuevo PDF

    // Convertir a escala
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = canvas.width
    const imgHeight = canvas.height

    const ratio = imgWidth / imgHeight // Relación de aspecto
    const pdfRatio = pdfWidth / pdfHeight

    let renderWidth
    let renderHeight

    if (ratio > pdfRatio) {
      // Si el pdf es más ancho
      renderWidth = pdfWidth
      renderHeight = pdfWidth / ratio
    } else {
      // Si el pdf es más alto
      renderHeight = pdfHeight
      renderWidth = pdfHeight * ratio
    }

    pdf.addImage(imgData, 'PNG', 0, 0, renderWidth, renderHeight)
    pdf.save('download.pdf') // Descarga el PDF
  }

  const undo = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (undoStack.length > 0 && ctx && canvasRef.current) {
      // Si hay 10 o más, se restauran las últimas 10 imágenes
      const lastImages = undoStack.slice(-10)

      setRedoStack((prevRedoStack) => [
        ...prevRedoStack,
        ctx.getImageData(0, 0, canvas.width, canvas.height),
      ])

      ctx.putImageData(lastImages[0], 0, 0) // Restaurar la más antigua de las 10 imágenes

      setUndoStack((prevUndoStack) => prevUndoStack.slice(0, -10)) // Remover las últimas 10 imágenes
    }
  }

  // Función para rehacer (ctrl+y)
  const redo = () => {
    if (redoStack.length > 0 && ctx && canvasRef.current) {
      const nextImage = redoStack.pop() // Obtener el siguiente estado
      setUndoStack([
        ...undoStack,
        ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height),
      ]) // Guardar el estado actual en el undo stack
      ctx.putImageData(nextImage!, 0, 0) // Restaurar el estado siguiente
      setRedoStack([...redoStack]) // Actualizar el redo stack
    }
  }

  const changeLineWidth = (newValue: string) => {
    if (ctx) {
      const newLineWidth = parseInt(newValue, 10)
      ctx.lineWidth = newLineWidth
      setLineWidth(newLineWidth)
    }
  }

  const changeLineColor = (color: string) => {
    setSelectedColor(color)
    if (ctx) ctx.strokeStyle = color
  }

  return (
    <PaintManagerContext.Provider
      value={{
        ctx,
        redo,
        undo,
        draw,
        mode,
        MODES,
        setMode,
        canvasRef,
        lineWidth,
        exportToPDF,
        stopDrawing,
        clearCanvas,
        startDrawing,
        selectedColor,
        changeLineColor,
        changeLineWidth,
      }}
    >
      {children}
    </PaintManagerContext.Provider>
  )
}

export default PaintManagerProvider
