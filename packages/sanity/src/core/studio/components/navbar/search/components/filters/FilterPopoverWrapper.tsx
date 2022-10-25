import {Box, Card, useClickOutside, useGlobalKeyDown} from '@sanity/ui'
import isHotkey from 'is-hotkey'
import React, {ReactNode, useCallback, useState} from 'react'
import FocusLock from 'react-focus-lock'

interface FilterPopoverWrapperProps {
  children?: ReactNode
  onClose: () => void
}

const isEscape = isHotkey('escape')

export function FilterPopoverWrapper({children, onClose}: FilterPopoverWrapperProps) {
  const [rootElement, setRootElement] = useState<HTMLElement | null>(null)

  const handleGlobalKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (isEscape(event)) {
        onClose()
      }
    },
    [onClose]
  )

  useClickOutside(onClose, [rootElement])
  useGlobalKeyDown(handleGlobalKeyDown)

  return (
    <FocusLock autoFocus>
      <Card overflow="hidden" radius={3} ref={setRootElement}>
        {children}
      </Card>
    </FocusLock>
  )
}
