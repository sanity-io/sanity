import {PortableTextEditor, usePortableTextEditor} from '@sanity/portable-text-editor'
import {Path} from '@sanity/types'
import {startsWith} from '@sanity/util/paths'
import {useEffect, useRef} from 'react'
import scrollIntoView from 'scroll-into-view-if-needed'
import {EditorElementWeakMap} from '../Compositor'
import {ObjectMemberType} from '../PortableTextInput'

interface Props {
  elementRefs: EditorElementWeakMap
  portableTextMembers: ObjectMemberType[]
  focusPath: Path
  scrollElement: HTMLElement | null
}

// This hook will scroll related editor item into view when the focusPath is pointing to a embedded object.
export function useScrollToFocusFromOutside(props: Props): void {
  const {elementRefs, portableTextMembers, focusPath, scrollElement} = props
  const targetPath = useRef<Path | null>(null)
  const editor = usePortableTextEditor()

  // This will scroll to the relevant block with focusPath pointing to an embedded object inside.
  useEffect(() => {
    if (targetPath.current === focusPath) {
      return
    }
    const member = portableTextMembers.find(
      (m) => 'item' in m && startsWith(m.item.path.slice(1), focusPath)
    )
    if (!member) {
      return
    }
    const elmRef = elementRefs.get(member.item.path)
    if (elmRef && elmRef.current && member && focusPath.length > 0) {
      targetPath.current = focusPath
      scrollIntoView(elmRef.current, {
        boundary: scrollElement,
        scrollMode: 'if-needed',
      })
      // Select the editor node  in the editor if the editor is missing a selection
      if (!PortableTextEditor.getSelection(editor)) {
        const editorPath = member.item.path.slice(1)
        const point = {path: editorPath, offset: 0}
        const selection = {anchor: point, focus: point}
        PortableTextEditor.select(editor, selection)
      }
    }
  }, [editor, elementRefs, focusPath, portableTextMembers, scrollElement])
}
