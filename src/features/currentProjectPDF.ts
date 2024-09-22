import { createSlice } from '@reduxjs/toolkit'

export const manageCurrentProjectPDF = createSlice({
  name: 'currentProjectPDF',
  initialState: null,
  reducers: {
    setCurrentProjectPDF: (_, action) => action.payload,
  },
})

export const { setCurrentProjectPDF } = manageCurrentProjectPDF.actions