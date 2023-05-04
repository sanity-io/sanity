import {Layer} from '@sanity/ui'
import styled, {css} from 'styled-components'
import {focusRingBorderStyle, focusRingStyle} from '../../components/withFocusRing/helpers'

export const Root = styled.div(({theme}) => {
  const {focusRing, input} = theme.sanity
  const base = theme.sanity.color.base
  const color = theme.sanity.color.input
  const border = {
    color: color.default.enabled.border,
    width: input.border.width,
  }

  return css`
    --input-box-shadow: ${focusRingBorderStyle(border)};

    position: relative;

    & [data-wrapper] {
      overflow: hidden;
      overflow: clip;
      position: relative;
      z-index: 1;
      padding: ${input.border.width}px;
    }

    & [data-border] {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      box-shadow: var(--input-box-shadow);
      z-index: 2;
      border-radius: 1px;
      pointer-events: none;
    }

    &:not([data-read-only])[data-focused] [data-border] {
      --input-box-shadow: ${focusRingStyle({
        base,
        border,
        focusRing,
      })};
    }
  `
})

// This element only wraps the input when in "fullscreen" mode
export const ExpandedLayer = styled(Layer)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`
