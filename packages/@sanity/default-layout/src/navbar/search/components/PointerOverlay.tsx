import React, {forwardRef} from 'react'
import styled from 'styled-components'

const PointerOverlayDiv = styled.div`
  bottom: 0;
  display: none;
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
  z-index: 1;

  @media (hover: hover) {
    &[data-enabled='true'] {
      display: block;
    }
  }
`

/**
 * Simple component which conditionally appears over command list items to cancel
 * existing :hover states for all child elements.
 *
 * It should only appear if hover capabilities are available (not on touch devices)
 */
export const PointerOverlay = forwardRef<HTMLDivElement>(function PointerOverlay(_props, ref) {
  return <PointerOverlayDiv aria-hidden="true" ref={ref} />
})
