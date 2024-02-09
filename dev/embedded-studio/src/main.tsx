import {StrictMode} from 'react'
import ReactDOM from 'react-dom/client'
// eslint-disable-next-line import/no-unassigned-import
import './index.css'
import {App} from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
