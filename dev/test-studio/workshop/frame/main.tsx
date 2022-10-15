import {StudioProvider} from 'sanity'
import {ThemeColorSchemeKey, usePrefersDark} from '@sanity/ui'
import {WorkshopFrame} from '@sanity/ui-workshop'
import React, {useMemo, useState} from 'react'
import {createRoot} from 'react-dom/client'
import Refractor from 'react-refractor'
import javascript from 'refractor/lang/javascript'
import json from 'refractor/lang/json'
import jsx from 'refractor/lang/jsx'
import typescript from 'refractor/lang/typescript'
import {createMemoryHistory} from 'history'
import sanityConfig from '../../sanity.config'
import {config} from '../config'

Refractor.registerLanguage(javascript)
Refractor.registerLanguage(json)
Refractor.registerLanguage(jsx)
Refractor.registerLanguage(typescript)

function Main() {
  const prefersDark = usePrefersDark()
  const [scheme, setScheme] = useState<ThemeColorSchemeKey>(prefersDark ? 'dark' : 'light')
  const history = useMemo(() => createMemoryHistory({initialEntries: [{pathname: '/test'}]}), [])

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
