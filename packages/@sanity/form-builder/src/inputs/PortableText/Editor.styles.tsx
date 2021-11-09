import {ScrollContainer} from '@sanity/base/components'
import {Card, rem} from '@sanity/ui'
import styled from 'styled-components'
import {parentCounterResetCSS} from './Text/TextBlock'

export const Root = styled(Card)<{$fullscreen: boolean}>`
  height: ${({$fullscreen}) => ($fullscreen ? '100%' : '15em')};

  &:not([hidden]) {
    display: flex;
  }

  flex-direction: column;
`

export const ToolbarCard = styled(Card)`
  z-index: 10;
  line-height: 0;
`

export const Scroller: any = styled(ScrollContainer)`
  position: relative;
  overflow: auto;
  height: 100%;
  display: flex;
  flex-direction: column;

  & > * {
    flex: 1;
    min-height: auto;
  }
`

export const EditableWrapper = styled(Card)`
  ${parentCounterResetCSS};

  &:not([hidden]) {
    display: flex;
  }

  min-height: 100%;
  position: relative;
  flex-direction: column;

  & > div {
    flex: 1;
    padding: ${({theme}) => rem(theme.sanity.space[3])};
    min-height: auto;
  }
`
