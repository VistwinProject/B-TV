import { createRoot } from 'react-dom/client'
import App, { PlaybackBoundary } from './App.jsx'
import './interface.css'
import './card-motion.css'
import './editor/editor.css'
import { DesignProvider } from './editor/DesignContext.jsx'

createRoot(document.getElementById('root')).render(<PlaybackBoundary><DesignProvider><App /></DesignProvider></PlaybackBoundary>)
