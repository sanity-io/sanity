import {ScrollContainer} from '@sanity/base/components'
import {Card, rem} from '@sanity/ui'
import styled from 'styled-components'
import {listCounterCSS} from './Text/TextBlock'

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
  /**
  * Add list counter CSS to keep track of the list count
  */
  ${listCounterCSS}

  & > div > div > div[class~='pt-list-item-bullet'] + div[class~='pt-list-item-number'],
  & > div > div > div[class~='pt-list-item-number'] + div[class~='pt-list-item-bullet'] {
    margin-top: ${({theme}) => theme.sanity.space[3]}px;
  }

  & > div > div > div:not(.pt-list-item) + .pt-list-item {
    margin-top: ${({theme}) => theme.sanity.space[2]}px;
  }

  & > div > div > .pt-list-item + div:not(.pt-list-item) {
    margin-top: ${({theme}) => theme.sanity.space[3]}px;
  }

  /**
  * Reset the list count if the item is not a numbered list item
  */
  & > div > div > div:not(.pt-list-item-number) {
    ${listCounterCSS};
  }

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
