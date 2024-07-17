import {type Path} from '@sanity/types'
import {isHotkey} from 'is-hotkey-esm'
import {useCallback, useEffect, useRef} from 'react'
import {type FormDocumentValue} from 'sanity'

import {useCopyPaste} from '../studio/copyPaste'
import {hasSelection, isEmptyFocusPath, isNativeEditableElement} from '../studio/copyPaste/utils'

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

  const {onCopy, onPaste} = useCopyPaste()

  const handleKeydown = useCallback(
    (event: KeyboardEvent) => {
      const targetElement = event.target

      if (isCopyHotKey(event)) {
        // We will skip handling this event if you have focus on an native editable element
        if (
          isNativeEditableElement(targetElement as HTMLElement) ||
          hasSelection() ||
          isEmptyFocusPath(focusPathRef.current)
        ) {
          return
        }

        event.preventDefault()
        event.stopPropagation()
        onCopy(focusPathRef.current, valueRef.current, {
          context: {source: 'keyboardShortcut'},
        })
      }

      if (isPasteHotKey(event)) {
        if (
          isNativeEditableElement(targetElement as HTMLElement) ||
          isEmptyFocusPath(focusPathRef.current)
        ) {
          return
        }

        event.stopPropagation()
        event.preventDefault()
        onPaste(focusPathRef.current, valueRef.current, {
          context: {source: 'keyboardShortcut'},
        })
      }
    },
    [onCopy, onPaste],
  )

  useEffect(() => {
    element?.addEventListener('keydown', handleKeydown)

    return () => {
      element?.removeEventListener('keydown', handleKeydown)
    }
  }, [element, handleKeydown, onPaste])
}
