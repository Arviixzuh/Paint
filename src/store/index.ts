import { configureStore } from '@reduxjs/toolkit'
import { manageCurrentProjectPDF } from '../features/currentProjectPDF'

const store = configureStore({
  reducer: {
    projectPDF: manageCurrentProjectPDF.reducer,
  },
})

export default store