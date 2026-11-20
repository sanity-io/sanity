import '@sanity/ui/styles.css'

import {createRoot} from 'react-dom/client'

import {App} from './App'
import {preloadReplica} from './replica'
import {installRouter} from './router'

// Reads the replica the last visit persisted while the session is checked.
preloadReplica()
installRouter()
createRoot(document.getElementById('root')!).render(<App />)
