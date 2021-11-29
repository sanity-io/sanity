import type {ThemeColorSchemeKey} from '@sanity/ui'
import {ErrorBoundary, ThemeProvider} from '@sanity/ui'
import {WorkshopFrame} from '@sanity/ui-workshop'
import React, {useCallback, useState} from 'react'
import ReactDOM from 'react-dom'
import Refractor from 'react-refractor'
import javascript from 'refractor/lang/javascript'
import json from 'refractor/lang/json'
import jsx from 'refractor/lang/jsx'
import typescript from 'refractor/lang/typescript'
import {theme} from '../theme'
import {scopes} from '$workshop'

Refractor.registerLanguage(javascript)
Refractor.registerLanguage(json)
Refractor.registerLanguage(jsx)
Refractor.registerLanguage(typescript)

function Main() {
  const [scheme, setScheme] = useState<ThemeColorSchemeKey>('light')

  const handleError = useCallback((params: {error: Error; info: React.ErrorInfo}) => {
    // eslint-disable-next-line no-console
    console.log('@todo: handle react error:', params)
  }, [])

  return (
    <ErrorBoundary onCatch={handleError}>
      <ThemeProvider scheme={scheme} theme={theme}>
        <WorkshopFrame
          frameUrl="/frame/"
          scopes={scopes}
          setScheme={setScheme}
          title="@sanity/ui"
        />
      </ThemeProvider>
    </ErrorBoundary>
  )
}

ReactDOM.render(<Main />, document.getElementById('root'))
