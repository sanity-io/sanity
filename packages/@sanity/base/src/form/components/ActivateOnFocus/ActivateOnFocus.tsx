// This is transitional in order to track usage of the ActivateOnFocusPart part from within the form-builder package
import React from 'react'
import {
  OverlayContainer,
  FlexContainer,
  CardContainer,
  ContentContainer,
} from './ActivateOnFocus.styles'

/**
 * @internal
 */
export interface ActivateOnFocusProps {
  children: React.ReactNode
  message?: React.ReactNode
  onActivate?: () => void
  isOverlayActive: boolean
}

/**
 * @internal
 */
export function ActivateOnFocus(props: ActivateOnFocusProps) {
  const {children, message, onActivate, isOverlayActive} = props

  function handleClick() {
    if (onActivate) {
      onActivate()
    }
  }

  function handleBlur() {
    if (onActivate && isOverlayActive) {
      onActivate()
    }
  }

  return (
    <OverlayContainer onClick={handleClick} onBlur={handleBlur}>
      {isOverlayActive && (
        <FlexContainer tabIndex={0} align="center" justify="center">
          <CardContainer
            // Almost all input elements have radius=1, and this component is
            // typically used for overlaying input elements.
            // @todo Consider making `radius` a component property of `ActivateOnFocus`.
            radius={1}
          />
          <ContentContainer>{message}</ContentContainer>
        </FlexContainer>
      )}
      {children}
    </OverlayContainer>
  )
}
