import {type ThemeColorSchemeKey, usePrefersDark} from '@sanity/ui'
import {WorkshopFrame} from '@sanity/ui-workshop'
import {createMemoryHistory} from 'history'
import {useState} from 'react'
import {createRoot} from 'react-dom/client'
import {registerLanguage} from 'react-refractor'
import javascript from 'refractor/javascript'
import json from 'refractor/json'
import jsx from 'refractor/jsx'
import typescript from 'refractor/typescript'
import {StudioProvider} from 'sanity'

import sanityConfig from '../../sanity.config'
import {config} from '../config'

registerLanguage(javascript)
registerLanguage(json)
registerLanguage(jsx)
registerLanguage(typescript)

const history = createMemoryHistory({initialEntries: [{pathname: '/test'}]})

function Main() {
  const prefersDark = usePrefersDark()
  const [scheme, setScheme] = useState<ThemeColorSchemeKey>(prefersDark ? 'dark' : 'light')

  return (
    <StudioProvider
      config={sanityConfig}
      scheme={scheme}
      onSchemeChange={setScheme}
      unstable_history={history}
    >
      <WorkshopFrame config={config} setScheme={setScheme} />
    </StudioProvider>
  )
}

const rootEl = document.getElementById('root')
if (!rootEl) {
  throw new Error('Root element not found')
}

const root = createRoot(rootEl)
root.render(<Main />)
