import {hues} from '@sanity/color'
import {Box, Card} from '@sanity/ui'
import {getVarName, vars} from '@sanity/ui/css'
import {css, styled} from 'styled-components'

export const Root = styled(Card)(rootStyle)

export const PreviewSpan = styled.span`
  display: block;
  max-width: calc(5em + 80px);
  position: relative;
`

export const TooltipBox = styled(Box)`
  max-width: 250px;
`

export function rootStyle() {
  return css`
    line-height: 0;
    border-radius: ${vars.radius[2]};
    padding: 2px;
    box-shadow: inset 0 0 0 1px ${vars.color.border};
    height: calc(1em - 1px);
    margin-top: 0.0625em;
    cursor: default;

    &:not([hidden]) {
      display: inline-flex;
      align-items: center;
      vertical-align: top;
    }

    &[data-ready-only] {
      cursor: default;
    }

    &[data-focused] {
      box-shadow: inset 0 0 0 1px ${vars.color.solid.primary.border[1]};
      color: ${vars.color.solid.primary.fg[0]};
    }

    &[data-selected] {
      background-color: ${vars.color.solid.primary.bg[0]};
    }

    &:not([data-focused]):not([data-selected]) {
      @media (hover: hover) {
        &:hover {
          ${getVarName(vars.color.border)}: ${vars.color.tinted.default.border[2]};
        }
      }
    }

    &[data-markers] {
      ${getVarName(vars.color.bg)}: ${vars.color.dark ? hues.purple[950].hex : hues.purple[50].hex};
    }

    &[data-warning] {
      ${getVarName(vars.color.bg)}: ${vars.color.tinted.caution.bg[2]};

      @media (hover: hover) {
        &:hover {
          ${getVarName(vars.color.border)}: ${vars.color.tinted.caution.border[2]};
        }
      }
    }

    &[data-invalid] {
      ${getVarName(vars.color.bg)}: ${vars.color.tinted.critical.bg[0]};
      ${getVarName(vars.color.border)}: ${vars.color.tinted.critical.border[1]};

      @media (hover: hover) {
        &:hover {
          ${getVarName(vars.color.border)}: ${vars.color.tinted.critical.border[2]};
        }
      }
    }
  `
}
