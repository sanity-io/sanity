import styled from 'styled-components'

export const Overlay: React.ComponentType = styled.div`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--card-bg-color);
  z-index: 3;
`
