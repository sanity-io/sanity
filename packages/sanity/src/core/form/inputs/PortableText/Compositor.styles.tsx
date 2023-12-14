/* eslint-disable camelcase */

import {Layer} from '@sanity/ui'
import styled, {css} from 'styled-components'
import {getTheme_v2} from '@sanity/ui/theme'
import {focusRingBorderStyle, focusRingStyle} from '../../components/withFocusRing/helpers'

export const Root = styled.div((props) => {
  const {color, input, radius} = getTheme_v2(props.theme)

  const border = {
    color: color.input.default.enabled.border,
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
      border-radius: ${radius[2]}px;
      pointer-events: none;
    }

    &:not([data-read-only])[data-focused] [data-border] {
      --input-box-shadow: ${focusRingStyle({
        base: color,
        border,
        focusRing: input.text.focusRing,
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
