/* eslint-disable import/named */

import styled, {DefaultTheme, StyledComponent} from 'styled-components'
import {Card} from '@sanity/ui'
import {fileTarget} from '../../common/fileTarget'
import {withFocusRing} from '../../../components/withFocusRing'

export type {FileInfo} from '../../common/fileTarget'

// Note: FileTarget needs its own focusRing because we need show it on click, not only when :focus-visible
export const FileTarget = fileTarget(withFocusRing(Card))

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
