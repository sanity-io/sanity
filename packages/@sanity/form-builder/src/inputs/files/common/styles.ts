/* eslint-disable import/named */

import styled, {DefaultTheme, StyledComponent} from 'styled-components'
import {Card} from '@sanity/ui'
import {fileTarget} from '../../common/fileTarget'

export type {FileInfo} from '../../common/fileTarget'

export const CardFileTarget = styled(Card)((props: {readOnly: boolean}) => {
  const readOnly = props.readOnly
  return `
  border-style: dashed !important;

  ${
    readOnly &&
    `
    &::after {
    background: var(--card-skeleton-color-to);
    content: '';
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    }
  `
  }
`
})

export const FileTarget = fileTarget(CardFileTarget)

export const Overlay: StyledComponent<'div', DefaultTheme> = styled.div`
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  top: 2px;
  left: 2px;
  right: 2px;
  bottom: 2px;
  background-color: var(--card-bg-color);
  z-index: 3;
  pointer-events: none;
`
