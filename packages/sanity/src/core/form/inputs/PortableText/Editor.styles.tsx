import {Card, Container, rem} from '@sanity/ui'
import styled, {css} from 'styled-components'
import {ScrollContainer} from '../../../components/scroll'
import {createListName, TEXT_LEVELS} from './text'

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
  position: relative;
  overflow: hidden;
  overflow: clip;

  & > [data-portal] {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;

    & > * {
      pointer-events: initial;
    }
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
  /* max-width: 728px; */
`

export const EditableWrapper = styled(Card)<{$isFullscreen: boolean; $readOnly?: boolean}>`
  height: 100%;
  width: 100%;
  counter-reset: ${TEXT_LEVELS.map((l) => createListName(l)).join(' ')};
  overflow: hidden;
  overflow: clip;

  & > div {
    height: 100%;
  }

  & .pt-editable {
    display: block;
    width: 100%;
    height: 100%;

    ${TEXT_LEVELS.map((l) => {
      return css`
        & > .pt-list-item-number[class~='pt-list-item-level-${l}'] {
          counter-increment: ${createListName(l)};
        }
      `
    })}

    & > .pt-list-item-bullet + .pt-list-item-number,
    & > .pt-list-item-number + .pt-list-item-bullet {
      margin-top: ${({theme}) => theme.sanity.space[3]}px;
      counter-reset: ${TEXT_LEVELS.map((l) => createListName(l)).join(' ')};
    }

    & > :not(.pt-list-item) + .pt-list-item {
      margin-top: ${({theme}) => theme.sanity.space[2]}px;
    }

    /* Reset the list count if the element is not a numbered list item */
    & > :not(.pt-list-item-number) {
      counter-reset: ${TEXT_LEVELS.map((l) => createListName(l)).join(' ')};
    }

    ${TEXT_LEVELS.slice(1).map((l) => {
      return css`
        & > .pt-list-item-level-${l} + .pt-list-item-level-${l - 1} {
          counter-reset: ${createListName(l)};
        }
      `
    })}

    & > .pt-list-item + :not(.pt-list-item) {
      margin-top: ${({theme}) => theme.sanity.space[3]}px;
    }

    & > :first-child {
      padding-top: ${({$isFullscreen, theme}) => theme.sanity.space[$isFullscreen ? 5 : 3]}px;
    }

    & > :last-child {
      padding-bottom: ${({$isFullscreen, theme}) => theme.sanity.space[$isFullscreen ? 9 : 5]}px;
    }

    /* & > .pt-block {
      & .pt-inline-object {
      }
    } */

    & .pt-drop-indicator {
      pointer-events: none;
      border: 1px solid var(--card-focus-ring-color) !important;
      height: 0px !important;
      border-radius: 1px;
      margin-top: -3px;
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
  }
`
