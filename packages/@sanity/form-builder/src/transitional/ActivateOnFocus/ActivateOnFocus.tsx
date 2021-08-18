// This is transitional in order to track usage of the ActivateOnFocusPart part from within the form-builder package
import React, {useState} from 'react'
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
}

export default function ActivateOnFocus(props: Props) {
  const [isActive, setActive] = useState(true)
  const {children, html, onActivate} = props

  function handleClick() {
    setActive(false)

    if (onActivate) {
      onActivate()
    }
  }

  return (
    <OverlayContainer tabIndex={0} onClick={handleClick}>
      {isActive && (
        <FlexContainer align="center" justify="center">
          <CardContainer />
          <ContentContainer>{html}</ContentContainer>
        </FlexContainer>
      )}
      {children}
    </OverlayContainer>
  )
}
