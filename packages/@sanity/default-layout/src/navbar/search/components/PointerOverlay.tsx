import {Box} from '@sanity/ui'
import React, {forwardRef} from 'react'
import styled from 'styled-components'

/**
 * Simple hidden component which conditionally appears over command palette items to cancel
 * existing :hover states of any child elements.
 */
export const PointerOverlay = forwardRef<HTMLDivElement>(function PointerOverlay(_props, ref) {
  return <PointerOverlayWrapper aria-hidden="true" ref={ref} />
})

const PointerOverlayWrapper = styled(Box)`
  bottom: 0;
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
  z-index: 1;
`
