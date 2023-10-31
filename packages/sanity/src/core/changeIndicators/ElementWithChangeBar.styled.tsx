import styled, {css} from 'styled-components'
import {Theme} from '@sanity/ui'

interface ThemeContext {
  theme: Theme
}

interface RootProps {
  $changed?: boolean
  $disabled?: boolean
  $isReviewChangeOpen: boolean
  $withHoverEffect?: boolean
}

const animationSpeed = 250

export const ChangeBarWrapper = styled.div<RootProps>(
  ({$changed, $disabled, $isReviewChangeOpen}) => {
    if ($disabled)
      return css`
        ${ChangeBar} {
          display: none;
        }
      `

    return css`
      --change-bar-offset: 2px;

      display: flex;
      position: relative;

      @media (hover: hover) {
        &:hover {
          z-index: 10;
        }
      }

      /* hide when field is not changed */
      ${!$changed &&
      css`
        ${ChangeBar} {
          opacity: 0;
          pointer-events: none;
        }
      `}

      /* hide hover effect when review changes is open */
      ${$isReviewChangeOpen &&
      css`
        ${ChangeBarButton} {
          opacity: 0;
        }
      `}
    `
  },
)

export const FieldWrapper = styled.div`
  flex-grow: 1;
  min-width: 0;
`

export const ChangeBar = styled.div<{$zIndex: number}>`
  position: relative;
  opacity: 1;
  transition: opacity 100ms;
  z-index: ${({$zIndex}) => $zIndex};
`

export const ChangeBarMarker = styled.div(({theme}: ThemeContext) => {
  /* these colours aren't freely available on the current theme */
  const notSelectedColor = theme.sanity.color.spot.yellow
  const screenMedium = theme.sanity.media[0]

  return css`
    position: absolute;
    top: 0;
    left: var(--change-bar-offset);
    width: 2px;
    bottom: 0;
    background-color: ${notSelectedColor};
    border-radius: 1px;

    @media (min-width: ${screenMedium}px) {
      display: unset;
    }
  `
})

export const ChangeBarButton = styled.button<{$withHoverEffect?: boolean}>(
  ({theme, $withHoverEffect}) => {
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
      left: calc(-0.25rem + var(--change-bar-offset));
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
        left: -3px;
        border-radius: 8px;
        background: ${notSelectedColor};
      }

      &:focus {
        border: 0;
        outline: 0;
      }

      ${$withHoverEffect &&
      css`
        @media (hover: hover) {
          &:hover {
            opacity: 0.2;
          }
        }
      `}
    `
  },
)
