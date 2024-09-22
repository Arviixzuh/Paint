import React from 'react'
import {
  BiPen,
  BiRedo,
  BiSave,
  BiText,
  BiUndo,
  BiHeart,
  BiRuler,
  BiTrash,
  BiPencil,
  BiSquare,
  BiCircle,
  BiEraser,
  BiUpArrow,
} from 'react-icons/bi'

import { PiPaintBucket } from 'react-icons/pi'
import { paintColors } from './colors'
import { PaintManagerContext } from '../../../providers/PaintManager'

export const Toolbar = () => {
  const paintManagerContext = React.useContext(PaintManagerContext)
  if (!paintManagerContext) return

  const {
    redo,
    undo,
    mode,
    MODES,
    setMode,
    lineWidth,
    exportToPDF,
    clearCanvas,
    changeLineWidth,
    selectedColor,
    changeLineColor,
  } = paintManagerContext

  const toolBarItems = [
    {
      mode: MODES.DRAW,
      icon: <BiPencil />,
    },
    {
      mode: MODES.ERASE,
      icon: <BiEraser />,
    },
    {
      mode: MODES.TEXT,
      icon: <BiText />,
    },
    {
      mode: MODES.LINE,
      icon: <BiRuler />,
    },
    {
      mode: MODES.BUCKET,
      icon: <PiPaintBucket />,
    },
  ]

  const formasBarItems = [
    {
      mode: MODES.RECTANGLE,
      icon: <BiSquare />,
    },
    {
      mode: MODES.ELLIPSE,
      icon: <BiCircle />,
    },
    {
      mode: MODES.TRIANGLE,
      icon: <BiUpArrow />,
    },
    {
      mode: MODES.HEART,
      icon: <BiHeart />,
    },
  ]

  return (
    <nav className='w-full sticky top-0'>
      <div className='bg-white border'>
        <div className='flex space-x-2'>
          <button onClick={exportToPDF} className='p-1'>
            <BiSave />
          </button>
          <button onClick={clearCanvas} className='p-1'>
            <BiTrash />
          </button>
          <button onClick={undo} className='p-1'>
            <BiUndo />
          </button>
          <button onClick={redo} className='p-1'>
            <BiRedo />
          </button>
        </div>
      </div>
      <div className='flex bg-white p-4 shadow-lg  gap-6'>
        <div className='flex flex-col  justify-between items-center border-r border-gray-300 pr-6 gap-2'>
          <div className='grid grid-cols-4 gap-2'>
            {toolBarItems.map((item, index) => (
              <button
                key={index}
                onClick={() => setMode(item.mode)}
                className={`p-2 border rounded-md ${
                  mode === item.mode ? 'bg-[rgb(15,23,42)] text-[#ffffff]' : 'text-[rgb(15,23,42)]'
                }`}
              >
                {item.icon}
              </button>
            ))}
          </div>
          <p className='text-sm text-center text-[rgb(15,23,42)]'>Herramientas</p>
        </div>
        <div className='flex flex-col items-center  justify-between border-r border-gray-300 pr-6 gap-2'>
          <div className='grid grid-cols-4 gap-2'>
            {formasBarItems.map((item, index) => (
              <button
                key={index}
                onClick={() => setMode(item.mode)}
                className={`p-2 border rounded-md ${
                  mode === item.mode ? 'bg-[rgb(15,23,42)] text-[#ffffff]' : 'text-[rgb(15,23,42)]'
                }`}
              >
                {item.icon}
              </button>
            ))}
          </div>
          <p className='text-sm text-center text-[rgb(15,23,42)]'>Formas</p>
        </div>
        <div className='flex flex-col justify-between items-center gap-2 border-r  pr-6 border-gray-300'>
          <div>
            <div className='flex flex-col items-center justify-center'>
              <BiPen />
              {lineWidth} px
            </div>
            <input
              type='range'
              min='1'
              max='100'
              defaultValue={lineWidth}
              onChange={(e) => {
                changeLineWidth(e.target.value)
              }}
              className='w-20'
            />
          </div>
          <p className='text-sm text-center text-[rgb(15,23,42)]'>Tamaño del pincel</p>
        </div>
        <div className='flex flex-col items-center border-r border-gray-300 pr-6 gap-2'>
          <div className='grid grid-cols-8 gap-2'>
            {paintColors.map((color, index) => (
              <div
                key={index}
                className={`w-5 h-5 rounded-full border-2 ${
                  selectedColor === color ? 'border-blue-500' : 'border'
                } cursor-pointer`}
                style={{ backgroundColor: color }}
                onClick={() => changeLineColor(color)}
              ></div>
            ))}
          </div>
          <p className='text-sm text-center text-[rgb(15,23,42)]'>Colores</p>
        </div>
      </div>
    </nav>
  )
}
