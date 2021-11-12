import {ChangeIndicatorWithProvidedFullPath} from '@sanity/base/change-indicators'
import {hues} from '@sanity/color'
import {Box, Flex, Theme} from '@sanity/ui'
import styled, {css} from 'styled-components'
import {TEXT_BULLET_MARKERS, TEXT_NUMBER_FORMATS} from './constants'
import {createListName} from './helpers'

interface TextBlockStyleProps {
  $level?: number
}

function textBlockStyle(props: TextBlockStyleProps & {theme: Theme}) {
  const {$level, theme} = props
  const {color, fonts, radius, space} = theme.sanity
  const numberMarker = TEXT_NUMBER_FORMATS[($level - 1) % TEXT_NUMBER_FORMATS.length]
  const bulletMarker = TEXT_BULLET_MARKERS[($level - 1) % TEXT_BULLET_MARKERS.length]

  return css`
    --marker-bg-color: transparent;

    mix-blend-mode: ${color.dark ? 'screen' : 'multiply'};
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
    }

    &[data-custom-markers] {
      --marker-bg-color: ${color.dark ? hues.purple[950].hex : hues.purple[50].hex};
    }

    &[data-warning] {
      --card-border-color: ${color.muted.caution.enabled.border};
      --marker-bg-color: ${color.muted.caution.hovered.bg};
    }

    &[data-error] {
      --card-border-color: ${color.muted.critical.enabled.border};
      --marker-bg-color: ${color.muted.critical.hovered.bg};
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
      font-family: ${fonts.text.family};
      flex: 1;

      *::selection {
        background-color: ${color.selectable.primary.pressed.bg};
      }
    }
  `
}

export const TextRoot = styled.div<TextBlockStyleProps>(textBlockStyle)

export const TextBlockFlexWrapper = styled(Flex)`
  position: relative;
`

export const ListPrefixWrapper = styled.div`
  user-select: none;
  white-space: nowrap;
`

export const BlockActionsOuter = styled(Box)`
  line-height: 0;
  width: 25px;
  position: relative;
  user-select: none;

  /* Without this, select all (CMD-A) will not work properly */
  /* when the editor is in non-fullscreen mode. */
  &:before {
    content: ' ';
    font-size: 0;
  }
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

export const ChangeIndicatorWrapper = styled.div(({theme}: {theme: Theme}) => {
  const {space} = theme.sanity

  return css`
    position: absolute;
    width: ${space[2]}px;
    right: -${space[2]}px;
    top: -${space[1]}px;
    bottom: -${space[1]}px;
    overflow-x: hidden;
    padding-left: ${space[1]}px;
    user-select: none;
  `
})

export const StyledChangeIndicatorWithProvidedFullPath = styled(
  ChangeIndicatorWithProvidedFullPath
)`
  width: 1px;
  height: 100%;

  & > div {
    height: 100%;
  }
`
