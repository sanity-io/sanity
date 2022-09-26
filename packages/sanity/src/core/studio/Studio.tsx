import {ThemeColorSchemeKey} from '@sanity/ui'
import {History} from 'history'
import React from 'react'
import {Config} from '../config'
import {StudioProvider} from './StudioProvider'
import {useWorkspace} from './workspace'

export interface StudioProps {
  config: Config
  onSchemeChange?: (nextScheme: ThemeColorSchemeKey) => void
  scheme?: ThemeColorSchemeKey
  unstable_history?: History
  unstable_noAuthBoundary?: boolean
}

function StudioLayout() {
  const {Layout} = useWorkspace().studio.components

  return <Layout />
}

export function Studio(props: StudioProps) {
  return (
    <StudioProvider {...props}>
      <StudioLayout />
    </StudioProvider>
  )
}
