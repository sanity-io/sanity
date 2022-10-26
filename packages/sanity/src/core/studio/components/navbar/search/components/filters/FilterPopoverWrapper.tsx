import {Card, useGlobalKeyDown} from '@sanity/ui'
import isHotkey from 'is-hotkey'
import React, {ReactNode, useCallback} from 'react'
import FocusLock from 'react-focus-lock'

interface FilterPopoverWrapperProps {
  children?: ReactNode
  onClose: () => void
}

const isEscape = isHotkey('escape')

export function FilterPopoverWrapper({children, onClose}: FilterPopoverWrapperProps) {
  const handleGlobalKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (isEscape(event)) {
        onClose()
      }
    },
    [onClose]
  )

  useGlobalKeyDown(handleGlobalKeyDown)

  return (
    <FocusLock autoFocus returnFocus>
      <Card overflow="hidden" radius={3}>
        {children}
      </Card>
    </FocusLock>
  )
}
