import {Card, Flex, useGlobalKeyDown, useLayer} from '@sanity/ui'
import isHotkey from 'is-hotkey'
import React, {ReactNode, useCallback, useEffect, useState} from 'react'
import FocusLock from 'react-focus-lock'
import styled from 'styled-components'
import {POPOVER_INPUT_PADDING, POPOVER_RADIUS, POPOVER_VERTICAL_MARGIN} from '../../../constants'

interface FilterPopoverWrapperProps {
  anchorElement?: HTMLElement | null
  children?: ReactNode
  onClose: () => void
}

const isEscape = isHotkey('escape')

const MAX_HEIGHT = 500 // px

const HiddenOverlay = styled.div`
  background: transparent;
  height: 100%;
  left: 0;
  position: fixed;
  top: 0;
  width: 100%;
  z-index: -1;
`

export function FilterPopoverWrapper({
  anchorElement,
  children,
  onClose,
}: FilterPopoverWrapperProps) {
  const {isTopLayer} = useLayer()

  const handleGlobalKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (isEscape(event) && isTopLayer) {
        onClose()
      }
    },
    [isTopLayer, onClose],
  )

  useGlobalKeyDown(handleGlobalKeyDown)

  const popoverOffset = usePopoverOffset(anchorElement || null)

  return (
    <>
      <HiddenOverlay onClick={onClose} />
      <FocusLock autoFocus={false} returnFocus>
        <Card
          display="flex"
          overflow="hidden"
          radius={POPOVER_RADIUS}
          style={{
            maxHeight: `min(calc(100vh - ${popoverOffset}px - ${POPOVER_VERTICAL_MARGIN}px - ${POPOVER_INPUT_PADDING}px), ${MAX_HEIGHT}px`,
            zIndex: 1,
          }}
        >
          <Flex>{children}</Flex>
        </Card>
      </FocusLock>
    </>
  )
}

function calcPopoverOffset(element: HTMLElement) {
  const rect = element.getBoundingClientRect()
  const offset = rect.y + rect.height + POPOVER_VERTICAL_MARGIN
  return offset
}

function usePopoverOffset(element: HTMLElement | null) {
  const [offset, setOffset] = useState<number | null>(element && calcPopoverOffset(element))

  const handleWindowResize = useCallback(() => {
    if (element) {
      setOffset(calcPopoverOffset(element))
    }
  }, [element])

  useEffect(() => {
    if (element) {
      setOffset(calcPopoverOffset(element))
    }
  }, [element])

  useEffect(() => {
    window.addEventListener('resize', handleWindowResize)
    return () => window.removeEventListener('resize', handleWindowResize)
  }, [handleWindowResize])

  return offset
}
