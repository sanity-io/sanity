import styled from 'styled-components'

export const RootWrapper = styled.div`
  position: relative;
`

export const OverlayWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 5;
`

export const RegionWrapper = styled.div`
  overflow: hidden;
  pointer-events: none;
  position: absolute;
`
