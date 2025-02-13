import {type Path} from '@sanity/types'
import {isHotkey} from 'is-hotkey-esm'
import {useEffect} from 'react'
import {useEffectEvent} from 'use-effect-event'

import {isFileTargetElement} from '../form/inputs/common/fileTarget/fileTarget'
import {type FormDocumentValue} from '../form/types/formDocumentValue'
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
  const {onCopy, onPaste} = useCopyPaste()

  const handleKeydown = useEffectEvent((event: KeyboardEvent) => {
    const targetElement = event.target

    if (isCopyHotKey(event)) {
      // We will skip handling this event if you have focus on an native editable element
      if (
        isNativeEditableElement(targetElement as HTMLElement) ||
        hasSelection() ||
        isEmptyFocusPath(focusPath!)
      ) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      onCopy(focusPath!, value, {
        context: {source: 'keyboardShortcut'},
      })
    }

    if (isPasteHotKey(event)) {
      if (
        isNativeEditableElement(targetElement as HTMLElement) ||
        isEmptyFocusPath(focusPath!) ||
        isFileTargetElement(targetElement as HTMLElement)
      ) {
        return
      }

      event.stopPropagation()
      event.preventDefault()
      onPaste(focusPath!, value, {
        context: {source: 'keyboardShortcut'},
      })
    }
  })

  useEffect(() => {
    element?.addEventListener('keydown', handleKeydown)

    return () => {
      element?.removeEventListener('keydown', handleKeydown)
    }
  }, [element, onPaste])
}
