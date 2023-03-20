import {ThemeColorSchemeKey} from '@sanity/ui'
import React, {ReactElement} from 'react'
import {Config} from '../config'
import {GlobalStyle} from './GlobalStyle'
import {RouterHistory} from './router'
import {useLayoutComponent} from './studio-components-hooks'
import {StudioProvider} from './StudioProvider'

/** @beta */
export interface StudioProps {
  config: Config
  basePath?: string
  onSchemeChange?: (nextScheme: ThemeColorSchemeKey) => void
  scheme?: ThemeColorSchemeKey
  /** @beta */
  unstable_history?: RouterHistory
  /** @beta */
  unstable_globalStyles?: boolean
  /** @beta */
  unstable_noAuthBoundary?: boolean
}

function StudioLayout() {
  const Layout = useLayoutComponent()

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
