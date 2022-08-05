// This is transitional in order to track usage of the ActivateOnFocusPart part from within the form-builder package
import React, {useCallback} from 'react'
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

  const handleClick = useCallback(() => {
    if (onActivate) {
      onActivate()
    }
  }, [onActivate])

  const handleBlur = useCallback(() => {
    if (onActivate && isOverlayActive) {
      onActivate()
    }
  }, [isOverlayActive, onActivate])

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
