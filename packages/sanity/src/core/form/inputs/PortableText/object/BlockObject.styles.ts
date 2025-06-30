import {hues} from '@sanity/color'
import {Box, Card, Flex} from '@sanity/ui'
import {getVarName, vars} from '@sanity/ui/css'
import {css, styled} from 'styled-components'

import {DEBUG} from '../../../../changeIndicators/constants'

export const Root = styled(Card)<{$isDark: boolean}>(({$isDark}) => {
  // const {color, radius, space} = props.theme.sanity

  const overlay = css`
    pointer-events: none;
    content: '';
    position: absolute;
    top: calc(0 - ${vars.space[1]});
    bottom: calc(0 - ${vars.space[1]});
    left: calc(0 - ${vars.space[1]});
    right: calc(0 - ${vars.space[1]});
    border-radius: ${vars.radius[2]};
    /* mix-blend-mode: ${$isDark ? 'screen' : 'multiply'}; */
  `

  return css`
    box-shadow: 0 0 0 1px ${vars.color.border};
    border-radius: ${vars.radius[1]};
    pointer-events: all;
    position: relative;

    &[data-focused] {
      ${getVarName(vars.color.border)}: ${vars.color.focusRing};
    }

    &:not([data-focused]):not([data-selected]) {
      @media (hover: hover) {
        &:hover {
          ${getVarName(vars.color.border)}: ${vars.color.tinted.default.border[2]};
        }
      }
    }

    &[data-markers] {
      &:after {
        ${overlay}
        background-color: ${$isDark ? hues.purple[950].hex : hues.purple[50].hex};
      }
    }

    &[data-warning] {
      &:after {
        ${overlay}
        background-color: ${vars.color.tinted.caution.bg[1]};
      }

      @media (hover: hover) {
        &:hover {
          ${getVarName(vars.color.border)}: ${vars.color.tinted.caution.border[2]};
        }
      }
    }

    &[data-invalid] {
      &:after {
        ${overlay}
        background-color: ${vars.color.tinted.critical.bg[1]};
      }

      @media (hover: hover) {
        &:hover {
          ${getVarName(vars.color.border)}: ${vars.color.tinted.critical.border[2]};
        }
      }
    }
  `
})

export const PreviewContainer = styled(Flex)`
  display: block;
  position: relative;
  width: 100%;
  user-select: none;
  pointer-events: all;
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

      [data-dragged] & {
        visibility: hidden;
      }
    `
  },
)

export const InnerFlex = styled(Flex)`
  position: relative;

  [data-dragged] > & {
    opacity: 0.5;
  }
`

export const BlockActionsOuter = styled(Box)`
  width: 25px;
  position: relative;
  flex-shrink: 0;
  user-select: none;

  [data-dragged] & {
    visibility: hidden;
  }
`

export const BlockActionsInner = styled(Flex)`
  position: absolute;
  right: 0;
  [data-dragged] & {
    visibility: hidden;
  }
`

export const TooltipBox = styled(Box)`
  max-width: 250px;
`
