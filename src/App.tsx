import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import BuilderPage from './components/pages/BuilderPage'
import CreateFormPage from './components/pages/CreateFormPage'
import FormsPage from './components/pages/FormsPage'
import AiCreatePage from './components/pages/AiCreatePage'
import NotFoundPage from './components/pages/NotFoundPage'

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/create" replace />} />
        <Route path="/create" element={<CreateFormPage />} />
        <Route path="/create/ai" element={<AiCreatePage />} />
        <Route path="/builder" element={<BuilderPage />} />
        <Route path="/forms" element={<FormsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
