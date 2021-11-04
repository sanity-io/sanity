import {ScrollContainer} from '@sanity/base/components'
import {Card, Container, rem} from '@sanity/ui'
import styled, {css} from 'styled-components'
import {createListName, LEVELS} from './Text/TextBlock'

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

export const EditableCard = styled(Card)`
  &::selection,
  *::selection {
    background-color: transparent;
  }
`

export const Scroller = styled(ScrollContainer)`
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

export const EditableContainer = styled(Container)`
  /* @todo: calculate from theme */
  max-width: 728px;
`

export const EditableWrapper = styled(Card)<{$isFullscreen: boolean}>`
  counter-reset: ${LEVELS.map((l) => createListName(l)).join(' ')};

  ${LEVELS.map((l) => {
    return css`
      & ${`[class~='pt-list-item-level-${l}']`}[class~='pt-list-item-number'] {
        counter-increment: ${createListName(l)};
      }
    `
  })}

  & > div > div > div[class~='pt-list-item-bullet'] + div[class~='pt-list-item-number'],
  & > div > div > div[class~='pt-list-item-number'] + div[class~='pt-list-item-bullet'] {
    margin-top: ${({theme}) => theme.sanity.space[3]}px;
    counter-reset: ${LEVELS.map((l) => createListName(l)).join(' ')};
  }

  & > div > div > div:not([class~='pt-list-item']) + [class~='pt-list-item'] {
    margin-top: ${({theme}) => theme.sanity.space[2]}px;
  }

  /* Reset the list count if the element is not a numbered list item */
  & > div > div > div:not([class~='pt-list-item-number']) {
    counter-reset: ${LEVELS.map((l) => createListName(l)).join(' ')};
  }

  ${LEVELS.slice(1).map((l) => {
    return css`
      & > div > div > ${`.pt-list-item-level-${l}`} + ${`.pt-list-item-level-${l - 1}`} {
        counter-reset: ${createListName(l)};
      }
    `
  })}

  .pt-drop-indicator {
    border: 1px solid var(--card-focus-ring-color) !important;
    height: 0px !important;
    border-radius: 1px;
    left: calc(
      ${({$isFullscreen, theme}) =>
          $isFullscreen ? rem(theme.sanity.space[5]) : rem(theme.sanity.space[3])} - 1px
    );
    right: calc(
      ${({$isFullscreen, theme}) =>
          $isFullscreen ? rem(theme.sanity.space[5]) : rem(theme.sanity.space[3])} - 1px
    );
    width: calc(
      100% -
        ${({$isFullscreen, theme}) =>
          $isFullscreen ? rem(theme.sanity.space[5] * 2) : rem(theme.sanity.space[3] * 2)} + 2px
    ) !important;
  }

  & > div > div > .pt-list-item + div:not(.pt-list-item) {
    margin-top: ${({theme}) => theme.sanity.space[3]}px;
  }

  &:not([hidden]) {
    display: flex;
  }

  min-height: 100%;
  position: relative;
  flex-direction: column;
  height: 100%;

  & > div {
    height: 100%;

    [data-slate-editor] {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 100%;

      .pt-block {
        &:first-child {
          padding-top: ${({$isFullscreen, theme}) => theme.sanity.space[$isFullscreen ? 5 : 3]}px;
        }

        &:last-child {
          padding-bottom: ${({$isFullscreen, theme}) =>
            theme.sanity.space[$isFullscreen ? 5 : 3]}px;
        }
      }
    }
  }
`
