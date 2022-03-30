/* eslint-disable complexity */
import {PortableTextEditor, usePortableTextEditor} from '@sanity/portable-text-editor'
import {Path, isKeySegment, isKeyedObject} from '@sanity/types'
import {useMemo} from 'react'
import {PortableTextBlock} from '../../../../../portable-text-editor/src/types/portableText'
import {ObjectEditData} from '../types'

// This hook will gather the info we need to create a edit modal for some embedded object in the editor
// based on the current focusPath details.
export function useObjectEditData(
  focusPath: Path,
  refs: {
    block: React.MutableRefObject<HTMLDivElement>
    child: React.MutableRefObject<HTMLSpanElement>
    inline: React.MutableRefObject<HTMLSpanElement>
  }
): ObjectEditData | null {
  const editor = usePortableTextEditor()
  const blockKey = focusPath && isKeySegment(focusPath[0]) ? focusPath[0]._key : undefined
  const isChild =
    blockKey && focusPath && focusPath[1] === 'children' && isKeyedObject(focusPath[2])
  const childKey = isChild && isKeyedObject(focusPath[2]) ? focusPath[2]._key : undefined
  const isAnnotation = blockKey && focusPath[1] === 'markDefs'
  const markDefKey = isAnnotation && isKeyedObject(focusPath[2]) ? focusPath[2]._key : undefined
  const focusPathLength = focusPath.length
  return useMemo(() => {
    // Annotations
    if (markDefKey) {
      const [node] = PortableTextEditor.findByPath(editor, [{_key: blockKey}])
      const block = node ? (node as PortableTextBlock) : undefined
      if (markDefKey) {
        const span = block.children.find(
          (child) => Array.isArray(child.marks) && child.marks.includes(markDefKey)
        )
        if (span) {
          return {
            editorPath: [{_key: blockKey}, 'children', {_key: span._key}],
            formBuilderPath: [{_key: blockKey}, 'markDefs', {_key: markDefKey}],
            kind: 'annotation',
            editorHTMLElementRef: refs.child,
          }
        }
      }
    }

    // Inline object
    if (blockKey && childKey && focusPathLength > 3) {
      const path = [{_key: blockKey}, 'children', {_key: childKey}]
      return {
        editorPath: path,
        formBuilderPath: path,
        kind: 'inlineObject',
        editorHTMLElementRef: refs.child,
      }
    }

    // Block object
    if (blockKey && !childKey && focusPathLength > 1) {
      const path = [{_key: blockKey}]
      return {
        editorPath: path,
        formBuilderPath: path,
        kind: 'blockObject',
        editorHTMLElementRef: refs.block,
      }
    }
    refs.child.current = null
    refs.block.current = null
    return null
  }, [editor, blockKey, childKey, markDefKey, refs.block, refs.child, focusPathLength])
}
