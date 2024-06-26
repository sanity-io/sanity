import {type Path} from '@sanity/types'
import {isHotkey} from 'is-hotkey-esm'
import {useCallback, useEffect, useRef} from 'react'
import {type FormDocumentValue, useCopyPasteAction} from 'sanity'

import {hasSelection, isNativeEditableElement} from '../studio/copyPaste/utils'

/** @internal */
export interface GlobalCopyPasteElementHandler {
  value: FormDocumentValue | undefined
  element: HTMLElement | null
  focusPath?: Path
}

const isCopyHotKey = isHotkey(`mod+c`)
const isPasteHotKey = isHotkey(`mod+v`)

/** @internal */
export function useGlobalCopyPasteElementHandler({
  value,
  element,
  focusPath,
}: GlobalCopyPasteElementHandler): void {
  const focusPathRef = useRef<Path>(focusPath || [])
  const valueRef = useRef(value)
  valueRef.current = value

  useEffect(() => {
    focusPathRef.current = focusPath || []
  }, [focusPath])

  const {onCopy, onPaste} = useCopyPasteAction()

  const handleCopy = useCallback(
    (event: ClipboardEvent) => {
      const targetElement = event.target as HTMLElement
      // We will skip handling this event if you have focus on an native editable element
      if (isNativeEditableElement(targetElement) || hasSelection()) {
        return
      }

      onCopy(focusPathRef.current, valueRef.current, {
        context: {source: 'keyboardShortcut'},
      })
    },
    [onCopy, focusPathRef],
  )

  const handleKeydown = useCallback(
    (event: KeyboardEvent) => {
      const targetElement = event.target

      if (isCopyHotKey(event)) {
        // We will skip handling this event if you have focus on an native editable element
        if (isNativeEditableElement(targetElement as HTMLElement) || hasSelection()) {
          return
        }

        event.preventDefault()
        event.stopPropagation()
        onCopy(focusPathRef.current, valueRef.current, {
          context: {source: 'keyboardShortcut'},
        })
      }

      if (isPasteHotKey(event)) {
        if (isNativeEditableElement(targetElement as HTMLElement)) {
          return
        }

        event.preventDefault()
        onPaste(focusPathRef.current, {
          context: {source: 'keyboardShortcut'},
        })
      }
    },
    [onCopy, onPaste, focusPathRef, valueRef],
  )

  useEffect(() => {
    const handlePaste = async (event: ClipboardEvent) => {
      const targetElement = event.target

      if (isNativeEditableElement(targetElement as HTMLElement)) {
        return
      }
      event.preventDefault()
      onPaste(focusPathRef.current)
    }

    element?.addEventListener('paste', handlePaste)
    element?.addEventListener('keydown', handleKeydown)
    element?.addEventListener('copy', handleCopy)

    return () => {
      element?.removeEventListener('paste', handlePaste)
      element?.removeEventListener('keydown', handleKeydown)
      element?.removeEventListener('copy', handleCopy)
    }
  }, [element, handleCopy, handleKeydown, onPaste])
}
