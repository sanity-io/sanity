import {
  EditorSelection,
  PortableTextEditor,
  usePortableTextEditor,
} from '@sanity/portable-text-editor'
import {Path} from '@sanity/types'
import {isEqual} from 'lodash'
import {useEffect, useRef} from 'react'
import scrollIntoView from 'scroll-into-view-if-needed'
import {ObjectEditData} from '../types'

// This hook will scroll related editor item into view when the focusPath is pointing to a embedded object.
export function useScrollToFocusFromOutside(
  hasFocus: boolean,
  focusPath: Path,
  objectEditData: ObjectEditData,
  scrollElement: HTMLElement
): void {
  const objectEditorPathRef = useRef<Path>(null)
  const focusPathRef = useRef<Path>(null)
  const editor = usePortableTextEditor()

  // This will scroll to the relevant block with focusPath pointing to an embedded object inside.
  useEffect(() => {
    if (
      !hasFocus &&
      objectEditData &&
      objectEditData.editorHTMLElementRef.current &&
      objectEditorPathRef.current !== objectEditData.editorPath
    ) {
      scrollIntoView(objectEditData.editorHTMLElementRef.current, {
        boundary: scrollElement,
        scrollMode: 'if-needed',
      })
      const point = {path: focusPath, offset: 0}
      const selection = {anchor: point, focus: point}
      PortableTextEditor.select(editor, selection)
      objectEditorPathRef.current = objectEditData.editorPath
    }
  }, [editor, focusPath, hasFocus, objectEditData, scrollElement])

  // This will scroll to the relevant text block if the focus path directly on a regular text block.
  useEffect(() => {
    if (
      !hasFocus &&
      objectEditData === null &&
      focusPath.length === 1 && // Only if single block
      !isEqual(focusPath, PortableTextEditor.getSelection(editor)?.focus.path) &&
      !PortableTextEditor.isObjectPath(editor, focusPath)
    ) {
      const [block] = PortableTextEditor.findByPath(editor, focusPath)
      const blockElm = PortableTextEditor.findDOMNode(editor, block) as HTMLElement
      if (blockElm) {
        scrollIntoView(blockElm, {
          boundary: scrollElement,
          scrollMode: 'if-needed',
        })
        const point = {path: focusPath, offset: 0}
        const selection: EditorSelection = {anchor: point, focus: point}
        PortableTextEditor.select(editor, selection)
        PortableTextEditor.focus(editor)
      }
    }
    focusPathRef.current = focusPath
  }, [editor, focusPath, hasFocus, objectEditData, scrollElement])
}
