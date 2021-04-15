/* eslint-disable import/named */

import styled, {DefaultTheme, StyledComponent} from 'styled-components'
import {Card} from '@sanity/ui'
import {fileTarget} from '../../common/fileTarget'
import {withFocusRing} from '../../../components/withFocusRing'

export type {FileInfo} from '../../common/fileTarget'

export const FileTarget = withFocusRing(fileTarget(Card))

export const Overlay: StyledComponent<'div', DefaultTheme> = styled.div`
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
  pointer-events: none;
`
