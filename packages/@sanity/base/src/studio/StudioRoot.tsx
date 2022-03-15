import {usePrefersDark, ThemeColorSchemeKey} from '@sanity/ui'
import React, {useEffect, useState} from 'react'
import Refractor from 'react-refractor'
import bash from 'refractor/lang/bash'
import javascript from 'refractor/lang/javascript'
import json from 'refractor/lang/json'
import jsx from 'refractor/lang/jsx'
import typescript from 'refractor/lang/typescript'
import {SanityConfig} from '../config'
import {Studio} from './Studio'
import {StudioProvider} from './StudioProvider'

Refractor.registerLanguage(bash)
Refractor.registerLanguage(javascript)
Refractor.registerLanguage(json)
Refractor.registerLanguage(jsx)
Refractor.registerLanguage(typescript)

export function StudioRoot(props: {config: SanityConfig}) {
  const {config} = props
  const prefersDark = usePrefersDark()
  const [scheme, setScheme] = useState<ThemeColorSchemeKey>(prefersDark ? 'dark' : 'light')

  useEffect(() => {
    setScheme(prefersDark ? 'dark' : 'light')
  }, [prefersDark])

  return (
    <StudioProvider config={config} scheme={scheme} setScheme={setScheme}>
      <Studio />
    </StudioProvider>
  )
}
