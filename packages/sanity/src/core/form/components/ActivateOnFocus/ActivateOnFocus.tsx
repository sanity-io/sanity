// This is transitional in order to track usage of the ActivateOnFocusPart part from within the form-builder package
import React, {KeyboardEvent, useCallback, useMemo, useState} from 'react'
import {Text} from '@sanity/ui'
import {useTranslation} from '../../../i18n'
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
  const {t} = useTranslation()

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
    [isOverlayActive, onActivate],
  )

  const handleOnFocus = useCallback(() => {
    setFocused(true)
  }, [])

  const handleBlur = useCallback(() => {
    setFocused(false)
  }, [])

  const msg = useMemo(() => {
    const isTouch = isTouchDevice()
    let messageContext

    if (isTouch) {
      messageContext = 'tap'
    } else if (focused) {
      messageContext = 'click-focused'
    } else {
      messageContext = 'click'
    }

    const text =
      message ||
      t('inputs.portable-text.activate-on-focus-message', {
        context: messageContext,
      })
    return <Text weight="medium">{text}</Text>
  }, [focused, message, t])

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
            radius={2}
          />
          <ContentContainer>{msg}</ContentContainer>
        </FlexContainer>
      )}
      {children}
    </OverlayContainer>
  )
}
