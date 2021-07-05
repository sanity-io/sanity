/* eslint-disable react/no-multi-comp */
import React from 'react'
import studioHintsConfig from 'part:@sanity/default-layout/studio-hints-config?'
import styled from 'styled-components'
import {Card, ThemeProvider, studioTheme} from '@sanity/ui'
import ToggleSidecarButton from './components/ToggleSidecarButton'
import HintsPackage from './components/HintsPackage'

const Root = styled(Card)`
  height: 100%;
  width: 100%;
  min-width: 420px;
`

const isMobile = () => {
  return typeof window !== 'undefined' && window.innerWidth < 512
}

export const isSidecarEnabled = () => studioHintsConfig && !isMobile()

export const SidecarLayout = () => {
  return (
    <ThemeProvider theme={studioTheme} scheme="dark">
      <Root display="flex" overflow="auto" sizing="border" tone="transparent" borderTop borderLeft>
        <HintsPackage />
      </Root>
    </ThemeProvider>
  )
}

export const SidecarToggleButton = () => {
  return <ToggleSidecarButton />
}
