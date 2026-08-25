import 'ui5/styles.css'
import './styles.css'

import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {createRoot} from 'react-dom/client'

import {App} from './App'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element not found')

createRoot(rootElement).render(
  <ThemeProvider scheme="dark" theme={buildTheme()}>
    <App />
  </ThemeProvider>,
)
