import React from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import { useNavigate } from 'react-router-dom'
import { CurrentPDFContext } from '../../providers/CurrentPDF'
import { BiArchive, BiFolderOpen } from 'react-icons/bi'

export const StartProject = () => {
  const navigate = useNavigate()
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)
  const currentPDFContext = React.useContext(CurrentPDFContext)
  if (!currentPDFContext) return
  const { setPdfDocument } = currentPDFContext

  const loadPDF = async (file: File) => {
    // Carga el archivo como un ArrayBuffer
    const fileData: ArrayBuffer = await file.arrayBuffer()

    // Convierte ArrayBuffer a Uint8Array
    const pdfData: Uint8Array = new Uint8Array(fileData)

    // Usa el Uint8Array
    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise
    setPdfDocument(pdf)
    navigate('/paint')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      loadPDF(file)
    }
  }

  const handleOpenPDFButtonClick = () => fileInputRef.current?.click()

  const Buttons = [
    {
      name: 'Crear nuevo',
      icon: <BiArchive />,
      action: () => navigate('/paint'),
    },
    {
      name: 'Abrir PDF',
      icon: <BiFolderOpen />,
      action: handleOpenPDFButtonClick,
    },
  ]

  return (
    <div className='flex flex-col gap-4 h-screen w-screen justify-center items-center'>
      <input
        type='file'
        accept='application/pdf'
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <div className='flex gap-4'>
        {Buttons.map((item, index) => (
          <button
            key={index}
            onClick={item.action}
            className='flex items-center gap-4 border rounded-md p-3 hover:bg-slate-200 transition-all ease-in'
          >
            {item.icon}
            {item.name}
          </button>
        ))}
      </div>
    </div>
  )
}
