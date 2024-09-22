import React from 'react'
import { Toolbar } from './components/Toolbar'
import { GlobalWorkerOptions } from 'pdfjs-dist'
import { PaintManagerContext } from '../../providers/PaintManager'

GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js`

export const Paint: React.FC = () => {
  const paintManagerContext = React.useContext(PaintManagerContext)
  if (!paintManagerContext) return null

  const { draw, canvasRef, stopDrawing, startDrawing } = paintManagerContext

  return (
    <div className='min-h-screen flex flex-col items-center bg-gray-100'>
      <Toolbar />
      <div className='mt-4 flex justify-center w-full'>
        <canvas
          ref={canvasRef}
          width={1024}
          height={576}
          className='border-2 border-gray-300 bg-transparent shadow-lg cursor-crosshair'
          onMouseUp={stopDrawing} // Dejar de dibujar cuando se suelta el mouse
          onMouseMove={draw} // Dibujar mientras se mueve el mouse
          onMouseDown={startDrawing} // Iniciar el dibujo al presionar el mouse
          onMouseLeave={stopDrawing} // Detener el dibujo si el mouse deja el canvas
        />
      </div>
    </div>
  )
}
