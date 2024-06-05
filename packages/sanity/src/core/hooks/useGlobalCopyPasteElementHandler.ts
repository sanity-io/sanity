import {type Path} from '@sanity/types'
import {isHotkey} from 'is-hotkey-esm'
import {useCallback, useEffect, useRef} from 'react'
import {type FormDocumentValue, useCopyPasteAction} from 'sanity'

import {
  insertTextAtCursor,
  isCopyPasteResult,
  isInputElement,
  isSelectionWithinInputElement,
  parseCopyResult,
  transformValueToPrimitive,
} from '../studio/copyPaste/utils'

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
}: GlobalCopyPasteElementHandler) {
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
      // Skip if this is coming from the PTE
      if (event.clipboardData?.getData('application/x-portable-text')) {
        return
      }

      // We will skip handling this event if you have a selection within a input/textarea element
      if (isSelectionWithinInputElement(targetElement)) {
        return
      }

      onCopy(focusPathRef.current, valueRef.current)
    },
    [onCopy, focusPathRef],
  )

  const handleKeydown = useCallback(
    (event: KeyboardEvent) => {
      const targetElement = event.target

      if (isCopyHotKey(event)) {
        // Prevent event propogation if we have a selection within an input element
        if (isSelectionWithinInputElement(targetElement as HTMLElement)) {
          return
        }

        event.preventDefault()
        event.stopPropagation()
        onCopy(focusPathRef.current, valueRef.current)
      }

      if (isPasteHotKey(event)) {
        // We will handle this event in the paste handler below if we are working with a input/textarea element
        if (isInputElement(targetElement) || isSelectionWithinInputElement(targetElement)) {
          return
        }

        event.preventDefault()
        onPaste(focusPathRef.current)
      }
    },
    [onCopy, onPaste, focusPathRef, valueRef],
  )

  useEffect(() => {
    const handlePaste = async (event: ClipboardEvent) => {
      const targetElement = event.target

      // We will only handle this event for input elements - otherwise we will deal with it in the keydown handler
      if (isInputElement(targetElement)) {
        event.preventDefault()

        const clipboardValue = event.clipboardData?.getData('text')

        // First we check if we have a copy/paste result in the clipboard
        if (isCopyPasteResult(clipboardValue)) {
          // Transform it to a primitive value so we can insert it into the input element
          const targetValue = transformValueToPrimitive(parseCopyResult(clipboardValue))

          // Lets check if we have a selection within the input element
          if (isSelectionWithinInputElement(targetElement)) {
            // We insert the value here instead of natively because we need to transform the value above
            insertTextAtCursor(targetElement, `${targetValue}`)
          } else {
            onPaste(focusPathRef.current)
          }
        } else {
          // If we don't have a copy/paste result in clipboard, pass through the event
          insertTextAtCursor(targetElement, `${clipboardValue}`)
        }
      }
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
