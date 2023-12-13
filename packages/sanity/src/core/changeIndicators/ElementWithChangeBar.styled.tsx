/* eslint-disable camelcase */

import styled, {css} from 'styled-components'
import {getTheme_v2} from '@sanity/ui/theme'

interface RootProps {
  $changed?: boolean
  $disabled?: boolean
  $hasFocus?: boolean
  $isReviewChangeOpen: boolean
  $withHoverEffect?: boolean
}

const animationSpeed = 250

export const ChangeBarWrapper = styled.div<RootProps>(
  ({$changed, $disabled, $hasFocus, $isReviewChangeOpen}) => {
    if ($disabled)
      return css`
        ${ChangeBarMarker}:after {
          display: none;
        }
      `

    return css`
      --change-bar-offset: 4px;

      display: flex;
      position: relative;

      ${ChangeBarMarker}:after {
        opacity: 0.5;
      }

      @media (hover: hover) {
        &:hover {
          z-index: 10;
          ${ChangeBarMarker}:after {
            opacity: 1;
          }
        }
      }

      /* hide when field is not changed */
      ${$hasFocus &&
      css`
        ${ChangeBarMarker}:after {
          opacity: 1;
        }
      `}

      /* hide when field is not changed */
      ${!$changed &&
      css`
        ${ChangeBarMarker}:after {
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

export const ChangeBarMarker = styled.div((props) => {
  const {media} = getTheme_v2(props.theme)

  return css`
    position: absolute;
    top: -1px;
    left: var(--change-bar-offset);
    width: 1px;
    bottom: -1px;
    background-color: var(--card-bg-color);

    @media (min-width: ${media[0]}px) {
      display: unset;
    }

    &:after {
      content: '';
      display: block;
      position: absolute;
      top: 1px;
      left: 0;
      width: 1px;
      bottom: 1px;
      background-color: var(--card-badge-caution-dot-color);
      border-radius: 0.5px;
    }
  `
})

export const ChangeBarButton = styled.button<{$withHoverEffect?: boolean}>((props) => {
  const {$withHoverEffect} = props

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
    width: calc(1rem - 1px);
    transition: opacity ${animationSpeed}ms;

    &:focus {
      border: 0;
      outline: 0;
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
})
