/* eslint-disable camelcase */

import {hues} from '@sanity/color'
import {Box, Flex, Theme} from '@sanity/ui'
import styled, {css} from 'styled-components'
import {getTheme_v2, rgba} from '@sanity/ui/theme'
import {TEXT_BULLET_MARKERS, TEXT_NUMBER_FORMATS} from './constants'
import {createListName} from './helpers'

interface TextBlockStyleProps {
  $level: number
}

function textBlockStyle(props: TextBlockStyleProps & {theme: Theme}) {
  const {$level} = props
  const {color, font, radius, space} = getTheme_v2(props.theme)

  const numberMarker = TEXT_NUMBER_FORMATS[($level - 1) % TEXT_NUMBER_FORMATS.length]
  const bulletMarker = TEXT_BULLET_MARKERS[($level - 1) % TEXT_BULLET_MARKERS.length]

  return css`
    --marker-bg-color: transparent;

    mix-blend-mode: ${color._dark ? 'screen' : 'multiply'};
    position: relative;

    & > [data-ui='TextBlock_inner'] {
      position: relative;
      flex: 1;
    }

    & > div:before {
      content: '';
      position: absolute;
      top: -${space[1]}px;
      bottom: -${space[1]}px;
      left: -${space[1]}px;
      right: -${space[1]}px;
      border-radius: ${radius[2]}px;
      background-color: var(--marker-bg-color);
      // This is to make sure the marker is always behind the text
      z-index: -1;
    }

    &[data-markers] {
      --marker-bg-color: ${color._dark ? hues.purple[950].hex : hues.purple[50].hex};
    }

    &[data-warning] {
      --card-border-color: ${color.button.ghost.caution.enabled.border};
      --marker-bg-color: ${color.button.ghost.caution.hovered.bg};
    }

    &[data-error] {
      --card-border-color: ${color.button.ghost.critical.enabled.border};
      --marker-bg-color: ${color.button.ghost.critical.hovered.bg};
    }

    & [data-list-prefix] {
      position: absolute;
      margin-left: -4.5rem;
      width: 3.75rem;
      text-align: right;
      box-sizing: border-box;
    }

    &[data-list-item='number'] [data-list-prefix] {
      font-variant-numeric: tabular-nums;

      & > span:before {
        content: counter(${createListName($level)}) '.';
        content: counter(${createListName($level)}, ${numberMarker}) '.';
      }
    }

    &[data-list-item='bullet'] [data-list-prefix] {
      & > span {
        position: relative;
        top: -0.1875em;

        &:before {
          content: '${bulletMarker}';
          font-size: 0.46666em;
        }
      }
    }

    & [data-text] {
      overflow-wrap: anywhere;
      text-transform: none;
      white-space: pre-wrap;
      font-family: ${font.text.family};
      flex: 1;

      *::selection {
        background-color: ${rgba(color.focusRing, 0.3)};
      }
    }
  `
}

export const TextRoot = styled.div<TextBlockStyleProps>(textBlockStyle)

// Because of a weird bug in Google Chrome regarding the @sanity/ui Flex component and spellchecking,
// this is set to be a Box with 'display: flex'. Using the Flex component here results in Chrome
// using 20% CPU when idle when spellchecking is on for some reason.
export const TextBlockFlexWrapper = styled(Box)`
  position: relative;
  display: flex;
`

export const ListPrefixWrapper = styled.div`
  user-select: none;
  white-space: nowrap;
`

export const BlockExtrasContainer = styled(Box)`
  user-select: none;
`

export const BlockActionsOuter = styled(Box)`
  line-height: 0;
  width: 25px;
  position: relative;
`

export const BlockActionsInner = styled(Flex)(({theme}: {theme: Theme}) => {
  const {fonts, space} = theme.sanity
  const textSize1 = fonts.text.sizes[1]
  const textSize2 = fonts.text.sizes[2]
  const capHeight1 = textSize1.lineHeight - textSize1.ascenderHeight - textSize1.descenderHeight
  const capHeight2 = textSize2.lineHeight - textSize2.ascenderHeight - textSize2.descenderHeight
  const buttonHeight = capHeight1 + space[2] + space[2]

  // This calculates the following:
  // > var buttonHeight = 25px
  // > var capHeight2 = 11px
  // > 0 - (buttonHeight - capHeight2) / 2 = -7px
  const negativeTop = 0 - (buttonHeight - capHeight2) / 2

  return css`
    user-select: none;
    position: absolute;
    right: 0;
    top: ${negativeTop}px;
  `
})

export const TooltipBox = styled(Box)`
  max-width: 250px;
`

export const TextFlex = styled(Flex)<{$level?: number}>`
  position: relative;
  padding-left: ${({$level}) => ($level ? $level * 32 : 0)}px;
`

export const ChangeIndicatorWrapper = styled.div<{$hasChanges: boolean}>(
  ({theme, $hasChanges}: {theme: Theme; $hasChanges: boolean}) => {
    const {space} = theme.sanity

    return css`
      position: absolute;
      width: ${space[2]}px;
      right: 0;
      top: 0;
      bottom: 0;
      padding-left: ${space[1]}px;
      user-select: none;

      ${!$hasChanges &&
      css`
        display: none;
      `}
    `
  },
)
