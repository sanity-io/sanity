import React from 'react'
import {StudioProvider, StudioProviderProps} from './StudioProvider'
import {StudioLayout} from './StudioLayout'

export type StudioProps = Omit<StudioProviderProps, 'children'>

export function Studio(props: StudioProps) {
  return (
    <StudioProvider {...props}>
      <StudioLayout />
    </StudioProvider>
  )
}
