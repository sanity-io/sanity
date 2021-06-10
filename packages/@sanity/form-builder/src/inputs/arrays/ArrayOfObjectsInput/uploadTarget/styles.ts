import styled from 'styled-components'
import {Layer} from '@sanity/ui'

export const Overlay = styled(Layer)`
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background-color: var(--card-bg-color);
  opacity: 0.8;
`
