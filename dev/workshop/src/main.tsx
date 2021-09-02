import {ThemeColorProvider, ThemeProvider, usePrefersDark} from '@sanity/ui'
import {Workshop, WorkshopLocation} from '@sanity/ui-workshop'
import React, {useCallback, useEffect, useMemo, useState} from 'react'
import ReactDOM from 'react-dom'
import Refractor from 'react-refractor'
import javascript from 'refractor/lang/javascript'
import json from 'refractor/lang/json'
import jsx from 'refractor/lang/jsx'
import typescript from 'refractor/lang/typescript'
import {createGlobalStyle} from 'styled-components'
import {theme as studioTheme} from './theme'
import {LocationProvider, useLocation} from './location'
import {scopes} from '$workshop'

Refractor.registerLanguage(javascript)
Refractor.registerLanguage(json)
Refractor.registerLanguage(jsx)
Refractor.registerLanguage(typescript)

const GlobalStyle = createGlobalStyle`
  html {
    background-color: ${({theme}) => theme.sanity.color.base.bg};
  }

  html,
  body,
  #root {
    height: 100%;
  }

  body {
    margin: 0;
  }

  #root {
    -webkit-font-smoothing: antialiased;
  }
`

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
]

function Root() {
  const {path, pushState, replaceState} = useLocation()

  const handleLocationPush = useCallback(
    (newLoc: WorkshopLocation) => pushState({path: newLoc.path}),
    [pushState]
  )

  const handleLocationReplace = useCallback(
    (newLoc: WorkshopLocation) => replaceState({path: newLoc.path}),
    [replaceState]
  )

  const studioLocation: WorkshopLocation = useMemo(() => ({path}), [path])

  const prefersDark = usePrefersDark()
  const [scheme, setScheme] = useState<'light' | 'dark'>(prefersDark ? 'dark' : 'light')

  useEffect(() => {
    setScheme(prefersDark ? 'dark' : 'light')
  }, [prefersDark])

  return (
    <ThemeProvider scheme={scheme} theme={studioTheme}>
      <ThemeColorProvider tone="transparent">
        <GlobalStyle />
      </ThemeColorProvider>
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
  )
}

ReactDOM.render(
  <LocationProvider>
    <Root />
  </LocationProvider>,
  document.getElementById('root')
)
