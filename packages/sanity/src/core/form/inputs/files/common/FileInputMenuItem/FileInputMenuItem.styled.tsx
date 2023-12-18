import styled from 'styled-components'
import {MenuItem} from '../../../../../../ui-components'

export const FileMenuItem = styled(MenuItem)`
  position: relative;

  & input {
    overflow: hidden;
    overflow: clip;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    position: absolute;
    min-width: 0;
    display: block;
    appearance: none;
    padding: 0;
    margin: 0;
    border: 0;
    opacity: 0;
  }
`
