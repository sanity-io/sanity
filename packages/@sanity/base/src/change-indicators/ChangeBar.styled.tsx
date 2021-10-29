import React from 'react'
import styled, {css} from 'styled-components'
import {Theme} from '@sanity/ui'
import {EditIcon} from '@sanity/icons'

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

const Shape = (props: Omit<React.SVGProps<SVGElement>, 'ref'>) => {
  return (
    <svg {...props} viewBox="0 0 20 27" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M9 0.448608C9 2.49663 7.38382 4.13678 5.57253 5.09261C2.55605 6.68443 0.5 9.8521 0.5 13.5C0.5 17.1479 2.55605 20.3155 5.57253 21.9074C7.38382 22.8632 9 24.5033 9 26.5514V27H11V26.5514C11 24.5033 12.6162 22.8632 14.4275 21.9074C17.4439 20.3155 19.5 17.1479 19.5 13.5C19.5 9.8521 17.4439 6.68443 14.4275 5.09261C12.6162 4.13678 11 2.49663 11 0.448608V0H9V0.448608Z"
        fill="currentColor"
      />
    </svg>
  )
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
    left: -1px;
    width: 2px;
    bottom: 0;
    background-color: ${notSelectedColor};
    border-bottom-right-radius: 2px;
    border-top-right-radius: 2px;

    @media (min-width: ${screenMedium}px) {
      display: unset;
    }
  `
})

export const BadgeWrapper = styled.div(({theme}: ThemeContext) => {
  const maxScreenMedium = theme.sanity.media[0] - 1

  return css`
    position: absolute;
    top: 50%;
    left: -9px;
    width: 19px;
    height: 19px;
    border-radius: 9.5px;
    transform: translate3d(-0.5px, -10px, 0) scale(0, 1);
    transition: transform ${animationSpeed}ms, opacity ${animationSpeed}ms;
    z-index: 12;
    pointer-events: none;

    @media (max-width: ${maxScreenMedium}px) {
      /* hide on mobile */
      display: none;
    }
  `
})

export const EditIconWrapper = styled(EditIcon)`
  display: block;
  position: relative;
  margin: 0;
  font-size: calc(19 / 16 * 1rem);
  color: var(--card-bg-color);
  opacity: 0;
  transition: opacity ${animationSpeed}ms;

  & path {
    stroke-width: 1.5px;
  }
`

export const ShapeWrapper = styled(Shape)(({theme}: ThemeContext) => {
  /* these colours aren't freely available on the current theme */
  const notSelectedColor = theme.sanity.color.spot.yellow
  const maxScreenMedium = theme.sanity.media[0] - 1

  return css`
    display: block;
    position: absolute;
    width: 20px;
    height: 27px;
    transform: translate3d(-0.5px, -4px, 0);
    color: ${notSelectedColor};

    @media (max-width: ${maxScreenMedium}px) {
      /* hide on mobile */
      display: none;
    }
  `
})

export const ButtonWrapper = styled.button`
  appearance: none;
  border: 0;
  outline: 0;
  display: block;
  padding: 0;
  background: 0;
  position: absolute;
  height: 100%;
  cursor: pointer;
  pointer-events: all;
  left: calc(0 - 0.25rem);
  width: calc(0.25rem + 1rem);

  &:focus {
    border: 0;
    outline: 0;
  }
`
/* for when the shape and icon need to appear on the page */
const BadgeOpen = css`
  ${BadgeWrapper} {
    transform: translate3d(-0.5px, -10px, 0) scale(1);
  }

  ${EditIconWrapper} {
    opacity: 1;
  }
`

export const ChangeBarWrapper = styled.div(
  ({focus, hover, changed, disabled, isReviewChangeOpen}: RootProps) => {
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

      /* on focus */

      ${focus &&
      css`
        ${ShapeWrapper} {
          color: var(--card-focus-ring-color);
        }

        ${BarWrapper},
        ${TooltipTriggerWrapper} {
          &:focus-within {
            ${BadgeOpen}
          }
          background-color: var(--card-focus-ring-color);
        }
      `}

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
