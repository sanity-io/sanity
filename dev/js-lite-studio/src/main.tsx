import '@sanity/ui/styles.css'

import {createRoot} from 'react-dom/client'

import {App} from './App'
import {installRouter} from './router'

installRouter()
createRoot(document.getElementById('root')!).render(<App />)
