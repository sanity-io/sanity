import {Button, Theme, rem} from '@sanity/ui'
import styled, {css} from 'styled-components'
import {focusRingStyle} from '../../../../components/withFocusRing/helpers'

export const invisibleInput = css`
  & input {
    overflow: hidden;
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

export const FileButton = styled(Button)(({theme, fromMenu}: {theme: Theme; fromMenu: boolean}) => {
  const {focusRing, radius} = theme.sanity
  const base = theme.sanity.color.base
  const border = {width: 1, color: 'var(--card-border-color)'}

  return css`
    ${!fromMenu &&
    css`
      &:not([data-disabled='true']) {
        &:focus-within {
          box-shadow: ${focusRingStyle({base, border, focusRing})};
        }
      }
    `}

    ${fromMenu &&
    css`
      &:not([data-disabled='true']):hover {
        background-color: var(--card-focus-ring-color);
        border-radius: ${rem(radius[2])};

        div {
          color: #fff;
        }
      }
    `}

    ${invisibleInput}
  `
})
