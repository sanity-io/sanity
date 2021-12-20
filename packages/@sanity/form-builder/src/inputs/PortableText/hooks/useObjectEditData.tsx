/* eslint-disable complexity */
import {
  PortableTextEditor,
  usePortableTextEditor,
  usePortableTextEditorSelection,
} from '@sanity/portable-text-editor'
import {isEqual} from 'lodash'
import {Path, isKeySegment, isKeyedObject, KeyedSegment} from '@sanity/types'
import {PortableTextBlock} from '../../../../../portable-text-editor/src/types/portableText'
import {ObjectEditData} from '../types'

export function useObjectEditData(
  focusPath: Path,
  refs: {
    block: React.MutableRefObject<HTMLDivElement>
    child: React.MutableRefObject<HTMLSpanElement>
  }
): ObjectEditData | null {
  const editor = usePortableTextEditor()
  const selection = usePortableTextEditorSelection()
  const sameSelection = selection && isEqual(selection.focus.path, focusPath)
  const blockSegment = focusPath && isKeySegment(focusPath[0]) ? focusPath[0] : undefined
  const isChild =
    blockSegment && focusPath && focusPath[1] === 'children' && isKeyedObject(focusPath[2])
  const isAnnotation = blockSegment && focusPath[1] === 'markDefs'

  // Handle focusPath pointing to a annotated span
  if (isAnnotation && !sameSelection) {
    const [node] = PortableTextEditor.findByPath(editor, focusPath.slice(0, 1))
    const block = node ? (node as PortableTextBlock) : undefined
    const markDefSegment =
      block && PortableTextEditor.isVoid(editor, block) === false && (focusPath[2] as KeyedSegment)
    if (markDefSegment) {
      const span = block.children.find(
        (child) => Array.isArray(child.marks) && child.marks.includes(markDefSegment._key)
      )
      if (span) {
        const spanPath = [blockSegment, 'children', {_key: span._key}] as Path
        return {
          editorPath: spanPath,
          formBuilderPath: focusPath.slice(0, 3),
          returnToSelection: selection,
          kind: 'annotation',
          editorHTMLElementRef: refs.child,
        }
      }
    }
  }

  // Handle focusPath pointing to block objects or inline objects
  if (focusPath && ((isChild && focusPath.length > 3) || (!isChild && focusPath.length > 1))) {
    let kind: 'annotation' | 'blockObject' | 'inlineObject' = 'blockObject'
    let path = focusPath.slice(0, 1)
    if (isChild) {
      kind = 'inlineObject'
      path = path.concat(focusPath.slice(1, 3))
    }
    const [node] = PortableTextEditor.findByPath(editor, path)
    // Only if it actually exists
    if (node) {
      return {
        editorPath: path,
        formBuilderPath: path,
        kind,
        returnToSelection: selection,
        editorHTMLElementRef: isChild ? refs.child : refs.block,
      }
    }
  }
  refs.child.current = null
  refs.block.current = null
  return null
}
