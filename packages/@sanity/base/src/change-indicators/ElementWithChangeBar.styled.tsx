import styled, {css} from 'styled-components'
import {Theme} from '@sanity/ui'

interface ThemeContext {
  theme: Theme
}

interface RootProps {
  focus: boolean
  hover: boolean
  changed: boolean
  isReviewChangeOpen: boolean
  disabled: boolean
}

const animationSpeed = 250

export const ChangeBar = styled.div`
  position: relative;
  opacity: 1;
  transition: opacity 100ms;
`

export const ChangeBarMarker = styled.div(({theme}: ThemeContext) => {
  /* these colours aren't freely available on the current theme */
  const notSelectedColor = theme.sanity.color.spot.yellow
  const screenMedium = theme.sanity.media[0]

  return css`
    position: absolute;
    top: 0;
    left: 2px;
    width: 2px;
    bottom: 0;
    background-color: ${notSelectedColor};
    border-radius: 1px;

    @media (min-width: ${screenMedium}px) {
      display: unset;
    }
  `
})

export const ChangeBarButton = styled.button(({theme}: ThemeContext) => {
  /* these colours aren't freely available on the current theme */
  const notSelectedColor = theme.sanity.color.spot.yellow

  return css`
    appearance: none;
    border: 0;
    outline: 0;
    display: block;
    padding: 0;
    background: transparent;
    opacity: 0;
    position: absolute;
    height: 100%;
    cursor: pointer;
    pointer-events: all;
    left: -0.25rem;
    width: 1rem;
    transition: opacity ${animationSpeed}ms;

    &:focus {
      border: 0;
      outline: 0;
    }

    &:after {
      content: '';
      width: 16px;
      height: calc(100% + 14px);
      display: block;
      position: absolute;
      top: -7px;
      left: -5px;
      border-radius: 16px;
      background: ${notSelectedColor};
    }

    &:focus {
      border: 0;
      outline: 0;
    }

    &:hover {
      opacity: 0.2;
    }
  `
})

export const ChangeBarWrapper = styled.div(({changed, disabled, isReviewChangeOpen}: RootProps) => {
  if (disabled)
    return css`
      ${ChangeBar} {
        display: none;
      }
    `

  return css`
    display: flex;
    position: relative;

    @media (hover: hover) {
      &:hover {
        z-index: 10;
      }
    }

    /* hide when field is not changed */
    ${!changed &&
    css`
      ${ChangeBar} {
        opacity: 0;
        pointer-events: none;
      }
    `}

    /* hide hover effect when review changes is open */
    ${isReviewChangeOpen &&
    css`
      ${ChangeBarButton} {
        opacity: 0;
      }
    `}
  `
})

export const FieldWrapper = styled.div`
  flex-grow: 1;
  min-width: 0;
`
