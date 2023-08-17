import {Button, Theme} from '@sanity/ui'
import styled, {css} from 'styled-components'
import {focusRingStyle} from '../../../../components/withFocusRing/helpers'

export const FileButton = styled(Button).attrs({forwardedAs: 'label'})(
  ({theme}: {theme: Theme}) => {
    const {focusRing} = theme.sanity
    const base = theme.sanity.color.base
    const border = {width: 1, color: 'var(--card-border-color)'}

    return css`
      &:not([data-disabled='true']) {
        &:focus-within {
          box-shadow: ${focusRingStyle({base, border, focusRing})};
        }
      }

      & input {
        overflow: hidden;
        overflow: clip;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        position: absolute;
        min-width: 0;
        display: block;
        appearance: none;
        padding: 0;
        margin: 0;
        border: 0;
        opacity: 0;
      }
    `
  },
)
