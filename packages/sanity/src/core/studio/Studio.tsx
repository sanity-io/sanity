import {ThemeColorSchemeKey} from '@sanity/ui'
import {History} from 'history'
import React, {ReactElement} from 'react'
import {Config} from '../config'
import {GlobalStyle} from './GlobalStyle'
import {StudioProvider} from './StudioProvider'
import {useWorkspace} from './workspace'

/** @beta */
export interface StudioProps {
  config: Config
  onSchemeChange?: (nextScheme: ThemeColorSchemeKey) => void
  scheme?: ThemeColorSchemeKey
  /** @beta */
  unstable_history?: History
  /** @beta */
  unstable_globalStyles?: boolean
  /** @beta */
  unstable_noAuthBoundary?: boolean
}

function StudioLayout() {
  const {Layout} = useWorkspace().studio.components

  return <Layout />
}

/** @beta */
export function Studio(props: StudioProps): ReactElement {
  const {unstable_globalStyles: globalStyles, ...restProps} = props

  return (
    <StudioProvider {...restProps}>
      {globalStyles && <GlobalStyle />}
      <StudioLayout />
    </StudioProvider>
  )
}
