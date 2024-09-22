import { Paint } from '../pages/Paint'
import { StartProject } from '../pages/StartProject'
import { Route, Routes } from 'react-router-dom'

const Router = () => {
  return (
    <Routes>
      <Route path='/' element={<StartProject />} />
      <Route path='/paint' element={<Paint />} />
    </Routes>
  )
}

export default Router
