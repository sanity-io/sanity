import React from 'react'
import {useLayoutComponent} from './studio-components-hooks'
import {StudioProvider, StudioProviderProps} from './StudioProvider'

export type StudioProps = Omit<StudioProviderProps, 'children'>

function StudioLayout() {
  const Layout = useLayoutComponent()

  return <Layout />
}

export function Studio(props: StudioProps) {
  return (
    <StudioProvider {...props}>
      <StudioLayout />
    </StudioProvider>
  )
}
