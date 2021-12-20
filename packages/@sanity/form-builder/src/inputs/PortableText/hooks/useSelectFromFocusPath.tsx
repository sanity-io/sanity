import {useRef} from 'react'
import {
  PortableTextEditor,
  usePortableTextEditor,
  usePortableTextEditorSelection,
} from '@sanity/portable-text-editor'
import {Path, isKeySegment, isKeyedObject} from '@sanity/types'
import {isEqual} from 'lodash'

export function useSelectFromFocusPath(focusPath: Path): void {
  const editor = usePortableTextEditor()
  const selection = usePortableTextEditorSelection()
  const focusPathRef = useRef<Path>(focusPath)
  if (!focusPath) {
    return
  }

  if (focusPathRef.current === focusPath) {
    return
  }

  const sameFocusPath = focusPath === focusPathRef.current
  const blockSegment = isKeySegment(focusPath[0]) ? focusPath[0] : undefined
  const isChild = blockSegment && focusPath[1] === 'children' && isKeyedObject(focusPath[2])
  const isBlockRootFocus = blockSegment && focusPath.length === 1
  const isChildRootFocus = isChild && focusPath.length === 3
  // if (!sameFocusPath && (isBlockRootFocus || isChildRootFocus)) {
  //   const sameAsSelection = isEqual(selection?.focus.path, focusPath)
  //   if (!sameAsSelection) {
  //     console.log('Selecting block or child from focusPath')
  //     const [blockOrChild] = PortableTextEditor.findByPath(editor, focusPath)
  //     if (blockOrChild) {
  //       const point = {path: focusPath, offset: 0}
  //       PortableTextEditor.select(editor, {focus: point, anchor: point})
  //     }
  //   }
  // }
  focusPathRef.current = focusPath
}
