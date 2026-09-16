import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import CameraTool from './CameraTool.jsx'
import './tool.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CameraTool />
  </StrictMode>,
)
