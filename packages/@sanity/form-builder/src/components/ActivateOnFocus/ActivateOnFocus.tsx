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
  html?: React.ReactNode
  onActivate?: () => void
  isActive: boolean
}

export default function ActivateOnFocus(props: Props) {
  const {children, html, onActivate, isActive} = props

  function handleClick() {
    if (onActivate) {
      onActivate()
    }
  }

  function handleBlur() {
    if (onActivate && !isActive) {
      onActivate()
    }
  }

  return (
    <OverlayContainer onClick={handleClick} onBlur={handleBlur}>
      {!isActive && (
        <FlexContainer tabIndex={0} align="center" justify="center">
          <CardContainer />
          <ContentContainer>{html}</ContentContainer>
        </FlexContainer>
      )}
      {children}
    </OverlayContainer>
  )
}
