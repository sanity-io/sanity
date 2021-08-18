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
}

export default function ActivateOnFocus(props: Props) {
  const [isActive, setActive] = useState(true)
  const {children, html} = props

  return (
    <OverlayContainer tabIndex={0}>
      <FlexContainer align="center" justify="center">
        <CardContainer />
        <ContentContainer>{html}</ContentContainer>
      </FlexContainer>
      {children}
    </OverlayContainer>
  )
}
