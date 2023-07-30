// This is transitional in order to track usage of the ActivateOnFocusPart part from within the form-builder package
import React, {KeyboardEvent, useCallback, useMemo, useState} from 'react'
import {Text} from '@sanity/ui'
import {
  OverlayContainer,
  FlexContainer,
  CardContainer,
  ContentContainer,
} from './ActivateOnFocus.styles'

const isTouchDevice = () =>
  (typeof window !== 'undefined' && 'ontouchstart' in window) ||
  (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0)

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
  const [focused, setFocused] = useState(false)

  const handleClick = useCallback(() => {
    if (onActivate) {
      onActivate()
    }
  }, [onActivate])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (!isOverlayActive) {
        return
      }
      if (event.code === 'Space' && onActivate) {
        event.preventDefault()
        onActivate()
      }
    },
    [isOverlayActive, onActivate]
  )

  const handleOnFocus = useCallback(() => {
    setFocused(true)
  }, [])

  const handleBlur = useCallback(() => {
    setFocused(false)
  }, [])

  const msg = useMemo(() => {
    const isTouch = isTouchDevice()
    let activateVerb = isTouch ? 'Tap' : 'Click'
    if (focused && !isTouch) {
      activateVerb += ' or press space'
    }
    const text = message || `${activateVerb} to activate`
    return <Text weight="semibold">{text}</Text>
  }, [focused, message])

  return (
    <OverlayContainer
      onBlur={handleBlur}
      onClick={handleClick}
      onFocus={handleOnFocus}
      onKeyDown={handleKeyDown}
    >
      {isOverlayActive && (
        <FlexContainer data-testid="activate-overlay" tabIndex={0} align="center" justify="center">
          <CardContainer
            // Almost all input elements have radius=1, and this component is
            // typically used for overlaying input elements.
            // @todo Consider making `radius` a component property of `ActivateOnFocus`.
            radius={1}
          />
          <ContentContainer>{msg}</ContentContainer>
        </FlexContainer>
      )}
      {children}
    </OverlayContainer>
  )
}
