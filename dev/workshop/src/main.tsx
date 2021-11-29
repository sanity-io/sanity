import {ErrorBoundary, ThemeProvider, usePrefersDark} from '@sanity/ui'
import type {WorkshopLocation} from '@sanity/ui-workshop'
import {Workshop} from '@sanity/ui-workshop'
import React, {useCallback, useEffect, useMemo, useState} from 'react'
import ReactDOM from 'react-dom'
import Refractor from 'react-refractor'
import javascript from 'refractor/lang/javascript'
import json from 'refractor/lang/json'
import jsx from 'refractor/lang/jsx'
import typescript from 'refractor/lang/typescript'
import {theme as studioTheme} from './theme'
import {LocationProvider, useLocation} from './location'
import {scopes} from '$workshop'

Refractor.registerLanguage(javascript)
Refractor.registerLanguage(json)
Refractor.registerLanguage(jsx)
Refractor.registerLanguage(typescript)

const WORKSHOP_COLLECTIONS = [
  {
    name: 'base',
    title: '@sanity/base',
  },
  {
    name: 'desk-tool',
    title: '@sanity/desk-tool',
  },
  {
    name: 'field',
    title: '@sanity/field',
  },
  {
    name: 'form-builder',
    title: '@sanity/form-builder',
  },
]

function Root() {
  const {path, pushState, query, replaceState} = useLocation()

  const handleLocationPush = useCallback((newLoc: WorkshopLocation) => pushState(newLoc), [
    pushState,
  ])

  const handleLocationReplace = useCallback((newLoc: WorkshopLocation) => replaceState(newLoc), [
    replaceState,
  ])

  const studioLocation: WorkshopLocation = useMemo(() => ({path, query}), [path, query])

  const prefersDark = usePrefersDark()
  const [scheme, setScheme] = useState<'light' | 'dark'>(prefersDark ? 'dark' : 'light')

  useEffect(() => {
    setScheme(prefersDark ? 'dark' : 'light')
  }, [prefersDark])

  const handleError = useCallback((params: {error: Error; info: React.ErrorInfo}) => {
    // eslint-disable-next-line no-console
    console.log('@todo: handle react error:', params)
  }, [])

  return (
    <ErrorBoundary onCatch={handleError}>
      <ThemeProvider scheme={scheme} theme={studioTheme}>
        <Workshop
          collections={WORKSHOP_COLLECTIONS}
          frameUrl="/frame/"
          location={studioLocation}
          onLocationPush={handleLocationPush}
          onLocationReplace={handleLocationReplace}
          scheme={scheme}
          scopes={scopes}
          setScheme={setScheme}
          title="Studio Workshop"
        />
      </ThemeProvider>
    </ErrorBoundary>
  )
}

ReactDOM.render(
  <LocationProvider>
    <Root />
  </LocationProvider>,
  document.getElementById('root')
)
