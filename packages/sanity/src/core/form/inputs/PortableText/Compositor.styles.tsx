import {Layer} from '@sanity/ui'
import {vars} from '@sanity/ui/css'
import {css, styled} from 'styled-components'

export const Root = styled.div((props) => {
  return css`
    --input-box-shadow: inset 0 0 0 ${vars.input.border.width} ${vars.color.border};

    position: relative;

    & [data-wrapper] {
      overflow: hidden;
      overflow: clip;
      position: relative;
      z-index: 1;
      padding: ${vars.input.border.width};
    }

    & [data-border] {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      box-shadow: var(--input-box-shadow);
      z-index: 2;
      border-radius: ${vars.radius[2]};
      pointer-events: none;
    }

    &:not([data-read-only])[data-focused] [data-border] {
      --input-box-shadow: inset 0 0 0 ${vars.input.border.width} ${vars.color.border};
      /* --input-box-shadow: focusRingStyle({
        base: color,
        border,
        focusRing: input.text.focusRing,
      }; */
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

  & > div {
    height: 100%;
  }
`
