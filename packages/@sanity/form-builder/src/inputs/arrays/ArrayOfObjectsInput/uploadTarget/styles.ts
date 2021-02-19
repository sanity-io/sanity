import styled from 'styled-components'

export const Overlay: React.ComponentType = styled.div`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background-color: var(--card-bg-color);
  z-index: 3;
  opacity: 0.8;
`
