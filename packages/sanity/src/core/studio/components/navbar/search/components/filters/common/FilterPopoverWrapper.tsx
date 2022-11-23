import {Card, Flex, useGlobalKeyDown} from '@sanity/ui'
import isHotkey from 'is-hotkey'
import React, {ReactNode, useCallback, useEffect, useState} from 'react'
import FocusLock from 'react-focus-lock'
import styled from 'styled-components'

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
  const handleGlobalKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (isEscape(event)) {
        onClose()
      }
    },
    [onClose]
  )

  useGlobalKeyDown(handleGlobalKeyDown)

  const maxHeight = usePopoverOffset(anchorElement || null)

  return (
    <>
      <HiddenOverlay onClick={onClose} />
      <FocusLock autoFocus={false} returnFocus>
        <Card
          display="flex"
          overflow="hidden"
          radius={3}
          style={{
            maxHeight: `min(calc(100vh - ${maxHeight}px), ${MAX_HEIGHT}px`,
            zIndex: 1,
          }}
        >
          <Flex>{children}</Flex>
        </Card>
      </FocusLock>
    </>
  )
}

function calcMaxHeight(element: HTMLElement) {
  const OFFSET = 10
  const rect = element.getBoundingClientRect()
  return rect.y + rect.height + OFFSET
}

function usePopoverOffset(element: HTMLElement | null) {
  const [offset, setOffset] = useState<number | null>(element && calcMaxHeight(element))

  const handleWindowResize = useCallback(() => {
    if (element) {
      setOffset(calcMaxHeight(element))
    }
  }, [element])

  useEffect(() => {
    if (element) {
      setOffset(calcMaxHeight(element))
    }
  }, [element])

  useEffect(() => {
    window.addEventListener('resize', handleWindowResize)
    return () => window.removeEventListener('resize', handleWindowResize)
  }, [handleWindowResize])

  return offset
}
