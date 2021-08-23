import {Range, Editor, Node as SlateNode} from 'slate'
import {ReactEditor} from '@sanity/slate-react'
import {fromSlateValue} from '../utils/values'
import {PortableTextFeatures} from '../types/portableText'
import {KEY_TO_VALUE_ELEMENT} from './weakMaps'

type DOMNode = globalThis.Node
type DOMText = globalThis.Text

const isDOMText = (value: any): value is DOMText => {
  return isDOMNode(value) && value.nodeType === 3
}

const isDOMNode = (value: any): value is DOMNode => {
  return value instanceof Node
}

/**
 * Check if the target is editable and in the editor.
 */
export const hasEditableTarget = (
  editor: ReactEditor,
  target: EventTarget | null
): target is DOMNode => {
  return isDOMNode(target) && ReactEditor.hasDOMNode(editor, target, {editable: true})
}

/**
 * Set the currently selected Portable Text fragment to the clipboard.
 */

export const setFragmentData = (
  dataTransfer: DataTransfer,
  editor: ReactEditor,
  portableTextFeatures: PortableTextFeatures
): void => {
  const {selection} = editor
  if (!selection) {
    return
  }

  const [start, end] = Range.edges(selection)
  const startVoid = Editor.void(editor, {at: start.path})
  const endVoid = Editor.void(editor, {at: end.path})

  if (Range.isCollapsed(selection) && !startVoid) {
    return
  }

  // Create a fake selection so that we can add a Base64-encoded copy of the
  // fragment to the HTML, to decode on future pastes.
  const domRange = ReactEditor.toDOMRange(editor, selection)
  let contents = domRange.cloneContents()
  let attach = contents.childNodes[0] as HTMLElement

  // Make sure attach is non-empty, since empty nodes will not get copied.
  contents.childNodes.forEach((node) => {
    if (node.textContent && node.textContent.trim() !== '') {
      attach = node as HTMLElement
    }
  })

  // COMPAT: If the end node is a void node, we need to move the end of the
  // range from the void node's spacer span, to the end of the void node's
  // content, since the spacer is before void's content in the DOM.
  if (endVoid) {
    const [voidNode] = endVoid
    const r = domRange.cloneRange()
    const domNode = ReactEditor.toDOMNode(editor, voidNode)
    r.setEndAfter(domNode)
    contents = r.cloneContents()
  }

  // COMPAT: If the start node is a void node, we need to attach the encoded
  // fragment to the void node's content node instead of the spacer, because
  // attaching it to empty `<div>/<span>` nodes will end up having it erased by
  // most browsers. (2018/04/27)
  if (startVoid) {
    attach = contents.querySelector('[data-slate-spacer]')! as HTMLElement
  }

  // Remove any zero-width space spans from the cloned DOM so that they don't
  // show up elsewhere when pasted.
  Array.from(contents.querySelectorAll('[data-slate-zero-width]')).forEach((zw) => {
    const isNewline = zw.getAttribute('data-slate-zero-width') === 'n'
    zw.textContent = isNewline ? '\n' : ''
  })

  // Set a `data-slate-fragment` attribute on a non-empty node, so it shows up
  // in the HTML, and can be used for intra-Slate pasting. If it's a text
  // node, wrap it in a `<span>` so we have something to set an attribute on.
  if (isDOMText(attach)) {
    const span = document.createElement('span')
    // COMPAT: In Chrome and Safari, if we don't add the `white-space` style
    // then leading and trailing spaces will be ignored. (2017/09/21)
    span.style.whiteSpace = 'pre'
    span.appendChild(attach)
    contents.appendChild(span)
    attach = span
  }

  const fragment = fromSlateValue(
    SlateNode.fragment(editor, selection),
    portableTextFeatures.types.block.name,
    KEY_TO_VALUE_ELEMENT.get(editor)
  )
  dataTransfer.setData('application/x-portable-text', JSON.stringify(fragment))
}
