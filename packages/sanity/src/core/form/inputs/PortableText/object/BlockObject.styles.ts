import {hues} from '@sanity/color'
import {Card, Theme, Flex, Box} from '@sanity/ui'
import styled, {css} from 'styled-components'

export const Root = styled(Card)((props: {theme: Theme}) => {
  const {color, radius, space} = props.theme.sanity

  const overlay = css`
    pointer-events: none;
    content: '';
    position: absolute;
    top: -${space[1]}px;
    bottom: -${space[1]}px;
    left: -${space[1]}px;
    right: -${space[1]}px;
    border-radius: ${radius[2]}px;
    mix-blend-mode: ${color.dark ? 'screen' : 'multiply'};
  `

  return css`
    box-shadow: 0 0 0 1px var(--card-border-color);
    border-radius: ${radius[1]}px;
    pointer-events: all;
    position: relative;

    &[data-focused] {
      box-shadow: 0 0 0 1px ${color.selectable?.primary.selected.border};
    }

    &:not([data-focused]):not([data-selected]) {
      @media (hover: hover) {
        &:hover {
          --card-border-color: ${color.input.default.hovered.border};
        }
      }
    }

    &[data-markers] {
      &:after {
        ${overlay}
        background-color: ${color.dark ? hues.purple[950].hex : hues.purple[50].hex};
      }
    }

    &[data-warning] {
      &:after {
        ${overlay}
        background-color: ${color.muted.caution.hovered.bg};
      }

      @media (hover: hover) {
        &:hover {
          --card-border-color: ${color.muted.caution.hovered.border};
        }
      }
    }

    &[data-invalid] {
      &:after {
        ${overlay}
        background-color: ${color.input.invalid.enabled.bg};
      }

      @media (hover: hover) {
        &:hover {
          --card-border-color: ${color.input.invalid.hovered.border};
        }
      }
    }
  `
})

export const PreviewContainer = styled(Flex)`
  user-select: none;
  pointer-events: none;
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

      [data-dragged] & {
        visibility: hidden;
      }
    `
  }
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
export const BlockPreview = styled(Box)``
