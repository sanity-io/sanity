import React from 'react'
import {StudioProvider, StudioProviderProps} from './StudioProvider'
import {useWorkspace} from './workspace'

export type StudioProps = Omit<StudioProviderProps, 'children'>

function StudioLayout() {
  const {renderLayout} = useWorkspace().studio
  const layout = renderLayout(undefined)

  return <>{layout}</>
}

export function Studio(props: StudioProps) {
  return (
    <StudioProvider {...props}>
      <StudioLayout />
    </StudioProvider>
  )
}
