import React from 'react'
import {StudioProvider, StudioProviderProps} from './StudioProvider'
import {StudioContents} from './StudioContents'

export type StudioProps = Omit<StudioProviderProps, 'children'>

export function Studio(props: StudioProps) {
  return (
    <StudioProvider {...props}>
      <StudioContents />
    </StudioProvider>
  )
}
