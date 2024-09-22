import React, { Dispatch, SetStateAction } from 'react'
import { useLocation } from 'react-router-dom'
import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api'

interface CurrentPDFContextType {
  setPdfDocument: Dispatch<SetStateAction<PDFDocumentProxy | null>>
  pdfDocument: PDFDocumentProxy | null
}

export const CurrentPDFContext = React.createContext<CurrentPDFContextType | undefined>(undefined)

interface CurrentPDFProviderProps {
  children: React.ReactNode
}

const CurrentPDFProvider: React.FC<CurrentPDFProviderProps> = ({ children }) => {
  const { pathname } = useLocation()
  const [pdfDocument, setPdfDocument] = React.useState<PDFDocumentProxy | null>(null)

  React.useEffect(() => {
    setPdfDocument(null)
  }, [pathname])

  return (
    <CurrentPDFContext.Provider value={{ setPdfDocument, pdfDocument }}>
      {children}
    </CurrentPDFContext.Provider>
  )
}

export default CurrentPDFProvider
