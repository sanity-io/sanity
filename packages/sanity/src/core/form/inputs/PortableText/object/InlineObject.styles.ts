import {Box, Card, Theme} from '@sanity/ui'
import styled, {css} from 'styled-components'
import {hues} from '@sanity/color'

export const Root = styled(Card)(rootStyle)

export const PreviewSpan = styled.span`
  display: block;
  max-width: calc(5em + 80px);
  position: relative;
`

export const TooltipBox = styled(Box)`
  max-width: 250px;
`

export function rootStyle({theme}: {theme: Theme}) {
  const {color, radius} = theme.sanity

  return css`
    line-height: 0;
    border-radius: ${radius[2]}px;
    padding: 2px;
    box-shadow: inset 0 0 0 1px var(--card-border-color);
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
      box-shadow: inset 0 0 0 1px ${color.selectable?.primary.selected.border};
      color: ${color.selectable?.primary.pressed.fg};
    }

    &[data-selected] {
      background-color: ${color.selectable?.primary.pressed.bg};
    }

    &:not([data-focused]):not([data-selected]) {
      @media (hover: hover) {
        &:hover {
          --card-border-color: ${color.input.default.hovered.border};
        }
      }
    }

    &[data-markers] {
      --card-bg-color: ${color.dark ? hues.purple[950].hex : hues.purple[50].hex};
    }

    &[data-warning] {
      --card-bg-color: ${color.muted.caution.hovered.bg};

      @media (hover: hover) {
        &:hover {
          --card-border-color: ${color.muted.caution.hovered.border};
        }
      }
    }

    &[data-invalid] {
      --card-bg-color: ${color.input.invalid.enabled.bg};
      --card-border-color: ${color.input.invalid.enabled.border};

      @media (hover: hover) {
        &:hover {
          --card-border-color: ${color.input.invalid.hovered.border};
        }
      }
    }
  `
}
