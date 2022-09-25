import React from 'react'
import {StudioProvider, StudioProviderProps} from './StudioProvider'
import {useWorkspace} from './workspace'

export type StudioProps = Omit<StudioProviderProps, 'children'>

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
