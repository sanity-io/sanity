import {Theme} from '@sanity/ui'
import styled, {css} from 'styled-components'
import {Button} from '../../../../../../ui'
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

      // The underyling file input is rendered as children within a Sanity UI <Button> component.
      // The below visibly hides it by targeting the input's parent <span> element, which is
      // added by the <Button> component.
      // TODO: refactor, avoid nth-child selector usage
      & > span:nth-child(2) {
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
