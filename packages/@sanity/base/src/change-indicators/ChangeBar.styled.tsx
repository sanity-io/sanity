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

const animationSpeed = 150

export const TooltipTriggerWrapper = styled.div`
  position: relative;
  opacity: 1;
  transition: opacity 100ms;
`

export const BarWrapper = styled.div(({theme}: ThemeContext) => {
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
    border-radius: 2px;

    @media (min-width: ${screenMedium}px) {
      display: unset;
    }
  `
})

export const BadgeWrapper = styled.div(({theme}: ThemeContext) => {
  const maxScreenMedium = theme.sanity.media[0] - 1

  return css`
    position: absolute;
    top: -8px;
    left: -4px;
    width: 19px;
    height: calc(100% + 16px);
    border-radius: 9.5px;
    opacity: 0;
    transition: opacity ${animationSpeed}ms;
    z-index: 12;
    pointer-events: none;

    @media (max-width: ${maxScreenMedium}px) {
      /* hide on mobile */
      display: none;
    }
  `
})

export const HitAreaButton = styled.button(({theme}: ThemeContext) => {
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
      height: calc(100% + 16px);
      display: block;
      position: absolute;
      top: -8px;
      left: -4px;
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

/* for when the shape and icon need to appear on the page */
const BadgeOpen = css`
  ${BadgeWrapper} {
    opacity: 0.2;
    transition: opacity ${animationSpeed}ms;
  }
`

export const ChangeBarWrapper = styled.div(
  ({
    // focus,
    hover,
    changed,
    disabled,
    isReviewChangeOpen,
  }: RootProps) => {
    if (disabled)
      return css`
        ${TooltipTriggerWrapper} {
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

      /* on hover */

      ${hover &&
      css`
        ${BadgeOpen}
      `}

      /* when field changed */

    ${!changed &&
      css`
        ${TooltipTriggerWrapper} {
          opacity: 0;
          pointer-events: none;
        }
      `}

      /* when review change is open */

      ${isReviewChangeOpen &&
      css`
        ${BadgeWrapper} {
          opacity: 0;
          pointer-events: none;
        }
      `}
    `
  }
)

export const FieldWrapper = styled.div`
  flex-grow: 1;
  min-width: 0;
`
