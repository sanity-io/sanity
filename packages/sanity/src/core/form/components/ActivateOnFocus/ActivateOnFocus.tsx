// This is transitional in order to track usage of the ActivateOnFocusPart part from within the form-builder package
import {Card, Flex, Text} from '@sanity/ui'
import {type KeyboardEvent, type ReactNode, useCallback, useMemo, useState} from 'react'

import {useTranslation} from '../../../i18n'
import {
  cardContainer,
  contentContainer,
  flexContainer,
  overlayContainer,
} from './ActivateOnFocus.css'

const isTouchDevice = () =>
  (typeof window !== 'undefined' && 'ontouchstart' in window) ||
  (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0)

/**
 * @internal
 */
export interface ActivateOnFocusProps {
  children: ReactNode
  message?: ReactNode
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

  const handleDragEnter = useCallback(() => {
    if (!isOverlayActive) {
      return
    }
    if (onActivate) {
      onActivate()
    }
  }, [isOverlayActive, onActivate])

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
    <div
      className={overlayContainer}
      onBlur={handleBlur}
      onClick={handleClick}
      onFocus={handleOnFocus}
      onKeyDown={handleKeyDown}
      onDragEnter={handleDragEnter}
    >
      {isOverlayActive && (
        <Flex className={flexContainer} data-testid="activate-overlay" tabIndex={0} align="center" justify="center">
          <Card
            className={cardContainer}
            // Almost all input elements have radius=1, and this component is
            // typically used for overlaying input elements.
            // @todo Consider making `radius` a component property of `ActivateOnFocus`.
            radius={2}
          />
          <div className={contentContainer}>{msg}</div>
        </Flex>
      )}
      {children}
    </div>
  )
}
