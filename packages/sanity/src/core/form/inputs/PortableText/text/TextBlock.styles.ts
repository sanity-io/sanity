import {hues} from '@sanity/color'
import {Box, Flex} from '@sanity/ui'
import {getVarName, vars} from '@sanity/ui/css'
import {css, styled} from 'styled-components'

import {DEBUG} from '../../../../changeIndicators/constants'
import {TEXT_BULLET_MARKERS, TEXT_NUMBER_FORMATS} from './constants'
import {createListName} from './helpers'

interface TextBlockStyleProps {
  $isDark: boolean
  $level: number
}

function textBlockStyle(props: TextBlockStyleProps) {
  const {$isDark, $level} = props

  const numberMarker = TEXT_NUMBER_FORMATS[($level - 1) % TEXT_NUMBER_FORMATS.length]
  const bulletMarker = TEXT_BULLET_MARKERS[($level - 1) % TEXT_BULLET_MARKERS.length]

  return css`
    --marker-bg-color: transparent;

    /* mix-blend-mode: ${$isDark ? 'screen' : 'multiply'}; */
    position: relative;

    & > [data-ui='TextBlock_inner'] {
      position: relative;
      flex: 1;
    }

    & > div:before {
      content: '';
      position: absolute;
      top: -${vars.space[1]};
      bottom: -${vars.space[1]};
      left: -${vars.space[1]};
      right: -${vars.space[1]};
      border-radius: ${vars.radius[2]};
      background-color: var(--marker-bg-color);
      // This is to make sure the marker is always behind the text
      z-index: -1;
      pointer-events: none;
    }

    &[data-markers] {
      --marker-bg-color: ${$isDark ? hues.purple[950].hex : hues.purple[50].hex};
    }

    &[data-warning] {
      ${getVarName(vars.color.border)}: ${vars.color.tinted.caution.border[2]};
      --marker-bg-color: ${vars.color.tinted.caution.bg[1]};
    }

    &[data-error] {
      ${getVarName(vars.color.border)}: ${vars.color.tinted.critical.border[2]};
      --marker-bg-color: ${vars.color.tinted.critical.bg[1]};
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
      font-family: ${vars.font.text.family};
      flex: 1;

      *::selection {
        background-color: color-mix(in srgb, transparent, ${vars.color.focusRing} 30%);
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

export const BlockActionsOuter = styled(Box)`
  line-height: 0;
  width: 25px;
  position: relative;
`

export const BlockActionsInner = styled(Flex)(() => {
  const textSize1 = vars.font.text.scale[1]
  const textSize2 = vars.font.text.scale[2]
  const capHeight1 = `calc(${textSize1.lineHeight} - ${textSize1.ascenderHeight} - ${textSize1.descenderHeight})`
  const capHeight2 = `calc(${textSize2.lineHeight} - ${textSize2.ascenderHeight} - ${textSize2.descenderHeight})`
  const buttonHeight = `calc(var(--capHeight1) + ${vars.space[2]} + ${vars.space[2]})`

  // This calculates the following:
  // > var buttonHeight = 25px
  // > var capHeight2 = 11px
  // > 0 - (buttonHeight - capHeight2) / 2 = -7px
  const negativeTop = `calc(0px - (var(--buttonHeight) - var(--capHeight2)) / 2)`

  return css`
    --capHeight1: ${capHeight1};
    --capHeight2: ${capHeight2};
    --buttonHeight: ${buttonHeight};

    user-select: none;
    position: absolute;
    right: 0;
    top: ${negativeTop};
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
  ({$hasChanges}: {$hasChanges: boolean}) => {
    return css`
      position: absolute;
      width: ${vars.space[2]};
      right: 0;
      top: 0;
      bottom: 0;
      padding-left: ${vars.space[1]};
      padding-right: ${vars.space[2]};
      user-select: none;
      ${DEBUG &&
      css`
        border: 1px solid red;
      `}

      ${!$hasChanges &&
      css`
        display: none;
      `}
    `
  },
)
