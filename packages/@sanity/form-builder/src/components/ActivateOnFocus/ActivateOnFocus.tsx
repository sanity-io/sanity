// This is transitional in order to track usage of the ActivateOnFocusPart part from within the form-builder package
import React from 'react'
import {
  OverlayContainer,
  FlexContainer,
  CardContainer,
  ContentContainer,
} from './ActivateOnFocus.styles'

interface Props {
  children: React.ReactNode
  message?: React.ReactNode
  onActivate?: () => void
  isOverlayActive: boolean
}

export default function ActivateOnFocus(props: Props) {
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
          <CardContainer />
          <ContentContainer>{message}</ContentContainer>
        </FlexContainer>
      )}
      {children}
    </OverlayContainer>
  )
}
