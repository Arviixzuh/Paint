import App from './App.tsx'
import React from 'react'
import store from './store/index.ts'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import CurrentPDFProvider from './providers/CurrentPDF.tsx'
import PaintManagerProvider from './providers/PaintManager.tsx'
import './index.scss'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <CurrentPDFProvider>
          <PaintManagerProvider>
            <App />
          </PaintManagerProvider>
        </CurrentPDFProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
)
