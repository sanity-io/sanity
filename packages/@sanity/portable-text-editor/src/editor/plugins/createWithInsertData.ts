import {Node, Element, Transforms, Editor, Descendant, Range, Text} from 'slate'
import {htmlToBlocks, normalizeBlock} from '@sanity/block-tools'
import {ReactEditor} from '@sanity/slate-react'
import {PortableTextFeatures, PortableTextBlock, PortableTextChild} from '../../types/portableText'
import {EditorChanges, PortableTextSlateEditor} from '../../types/editor'
import {fromSlateValue, toSlateValue} from '../../utils/values'
import {validateValue} from '../../utils/validateValue'
import {debugWithName} from '../../utils/debug'

const debug = debugWithName('plugin:withInsertData')

/**
 * This plugin handles copy/paste in the editor
 *
 */
export function createWithInsertData(
  change$: EditorChanges,
  portableTextFeatures: PortableTextFeatures,
  keyGenerator: () => string
) {
  return function withInsertData(editor: PortableTextSlateEditor): PortableTextSlateEditor {
    const blockTypeName = portableTextFeatures.types.block.name
    const spanTypeName = portableTextFeatures.types.span.name

    const toPlainText = (blocks: PortableTextBlock[]) => {
      return blocks
        .map((block) => {
          if (block._type === blockTypeName) {
            return block.children
              .map((child: PortableTextChild) => {
                if (child._type === spanTypeName) {
                  return child.text
                }
                return `[${
                  portableTextFeatures.types.inlineObjects.find((t) => t.name === child._type)
                    ?.title || 'Object'
                }]`
              })
              .join('')
          }
          return `[${
            portableTextFeatures.types.blockObjects.find((t) => t.name === block._type)?.title ||
            'Object'
          }]`
        })
        .join('\n\n')
    }

    editor.setFragmentData = (data: DataTransfer, originEvent) => {
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
      // Remove any zero-width space spans from the cloned DOM so that they don't
      // show up elsewhere when pasted.
      Array.from(contents.querySelectorAll('[data-slate-zero-width]')).forEach((zw) => {
        const isNewline = zw.getAttribute('data-slate-zero-width') === 'n'
        zw.textContent = isNewline ? '\n' : ''
      })
      // Clean up the clipboard HTML for editor spesific attributes
      Array.from(contents.querySelectorAll('*')).forEach((elm) => {
        elm.removeAttribute('contentEditable')
        elm.removeAttribute('data-slate-inline')
        elm.removeAttribute('data-slate-leaf')
        elm.removeAttribute('data-slate-node')
        elm.removeAttribute('data-slate-spacer')
        elm.removeAttribute('data-slate-string')
        elm.removeAttribute('data-slate-zero-width')
        elm.removeAttribute('draggable')
        for (const key in elm.attributes) {
          if (elm.hasAttribute(key)) {
            elm.removeAttribute(key)
          }
        }
      })
      const div = contents.ownerDocument.createElement('div')
      div.appendChild(contents)
      div.setAttribute('hidden', 'true')
      contents.ownerDocument.body.appendChild(div)
      const asHTML = div.innerHTML
      contents.ownerDocument.body.removeChild(div)
      const fragment = editor.getFragment()
      const portableText = fromSlateValue(fragment as Node[], portableTextFeatures.types.block.name)

      const asJSON = JSON.stringify(portableText)
      const asPlainText = toPlainText(portableText)
      data.clearData()
      data.setData('text/plain', asPlainText)
      data.setData('text/html', asHTML)
      data.setData('application/json', asJSON)
      data.setData('application/x-portable-text', asJSON)
      debug('text', asPlainText)
      data.setData('application/x-portable-text-event-origin', originEvent || 'external')
      debug('Set fragment data', asJSON, asHTML)
    }

    editor.insertPortableTextData = (data: DataTransfer): boolean => {
      if (!editor.selection) {
        return false
      }
      const pText = data.getData('application/x-portable-text')
      const origin = data.getData('application/x-portable-text-event-origin')
      debug(`Inserting portable text from ${origin} event`, pText)
      if (pText) {
        const parsed = JSON.parse(pText) as PortableTextBlock[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          const slateValue = regenerateKeys(
            editor,
            toSlateValue(parsed, {portableTextFeatures}),
            keyGenerator,
            spanTypeName
          )
          // Validate the result
          const validation = validateValue(parsed, portableTextFeatures, keyGenerator)
          // Bail out if it's not valid
          if (!validation.valid) {
            const errorDescription = `${validation.resolution?.description}`
            change$.next({
              type: 'error',
              level: 'warning',
              name: 'pasteError',
              description: errorDescription,
              data: validation,
            })
            debug('Invalid insert result', validation)
            return false
          }
          mixMarkDefs(editor, slateValue)
          editor.insertFragment(slateValue)
          editor.onChange()
          return true
        }
      }
      return false
    }

    editor.insertTextOrHTMLData = (data: DataTransfer): boolean => {
      if (!editor.selection) {
        debug('No selection, not inserting')
        return false
      }
      change$.next({type: 'loading', isLoading: true}) // This could potentially take some time
      const html = data.getData('text/html')
      const text = data.getData('text/plain')
      if (html || text) {
        debug('Inserting data', data)
        let portableText: PortableTextBlock[]
        let fragment: Node[]
        let insertedType

        if (html) {
          portableText = htmlToBlocks(html, portableTextFeatures.types.portableText).map((block) =>
            normalizeBlock(block, {blockTypeName})
          )
          fragment = toSlateValue(portableText, {portableTextFeatures})
          insertedType = 'HTML'
        } else {
          // plain text
          const blocks = escapeHtml(text)
            .split(/\n{2,}/)
            .map((line) =>
              line ? `<p>${line.replace(/(?:\r\n|\r|\n)/g, '<br/>')}</p>` : '<p></p>'
            )
            .join('')
          const textToHtml = `<html><body>${blocks}</body></html>`
          portableText = htmlToBlocks(textToHtml, portableTextFeatures.types.portableText).map(
            (block) => normalizeBlock(block, {blockTypeName})
          )
          fragment = toSlateValue(portableText, {
            portableTextFeatures,
          })
          insertedType = 'text'
        }

        // Validate the result
        const validation = validateValue(portableText, portableTextFeatures, keyGenerator)

        // Bail out if it's not valid
        if (!validation.valid) {
          const errorDescription = `Could not validate the resulting portable text to insert.\n${validation.resolution?.description}\nTry to insert as plain text (shift-paste) instead.`
          change$.next({
            type: 'error',
            level: 'warning',
            name: 'pasteError',
            description: errorDescription,
            data: validation,
          })
          debug('Invalid insert result', validation)
          return false
        }
        debug(`Inserting ${insertedType} fragment at ${JSON.stringify(editor.selection)}`)
        mixMarkDefs(editor, fragment)
        editor.insertFragment(fragment)
        editor.onChange()
        change$.next({type: 'loading', isLoading: false})
        return true
      }
      change$.next({type: 'loading', isLoading: false})
      return false
    }

    editor.insertData = (data: DataTransfer) => {
      if (!editor.insertPortableTextData(data)) {
        editor.insertTextOrHTMLData(data)
      }
    }

    editor.insertFragmentData = (data: DataTransfer): boolean => {
      const fragment = data.getData('application/x-portable-text')
      if (fragment) {
        const parsed = JSON.parse(fragment) as Node[]
        editor.insertFragment(parsed)
        return true
      }
      return false
    }

    return editor
  }
}

const entityMap: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
}
function escapeHtml(str: string) {
  return String(str).replace(/[&<>"'`=/]/g, (s: string) => entityMap[s])
}

function regenerateKeys(
  editor: PortableTextSlateEditor,
  fragment: Descendant[],
  keyGenerator: () => string,
  spanTypeName: string
) {
  return fragment.map((node) => {
    const newNode: Element = {...(node as Element)}
    // Ensure the copy has new keys
    if (editor.isTextBlock(newNode)) {
      newNode.markDefs = newNode.markDefs.map((def) => {
        const oldKey = def._key
        const newKey = keyGenerator()
        if (Array.isArray(newNode.children)) {
          newNode.children = newNode.children.map((child) =>
            child._type === spanTypeName && Text.isText(child)
              ? {
                  ...child,
                  marks:
                    child.marks && child.marks.includes(oldKey)
                      ? // eslint-disable-next-line max-nested-callbacks
                        [...child.marks].filter((mark) => mark !== oldKey).concat(newKey)
                      : child.marks,
                }
              : child
          )
        }
        return {...def, _key: newKey}
      })
    }
    const nodeWithNewKeys = {...newNode, _key: keyGenerator()} as Element
    if (editor.isTextBlock(nodeWithNewKeys)) {
      nodeWithNewKeys.children = nodeWithNewKeys.children.map((child) => ({
        ...child,
        _key: keyGenerator(),
      }))
    }
    return nodeWithNewKeys
  })
}

function mixMarkDefs(editor: PortableTextSlateEditor, fragment: any) {
  if (!editor.selection) {
    return false
  }
  const [focusBlock, focusPath] = Editor.node(editor, editor.selection, {depth: 1})
  if (editor.isTextBlock(focusBlock) && editor.isTextBlock(fragment[0])) {
    const {markDefs} = focusBlock
    debug('Mixing markDefs of focusBlock and fragments[0] block', markDefs, fragment[0].markDefs)
    // As the first block will be inserted into another block (potentially), mix those markDefs
    Transforms.setNodes(
      editor,
      {
        markDefs: [...fragment[0].markDefs, ...markDefs],
      },
      {at: focusPath, mode: 'lowest', voids: false}
    )
    return true
  }
  return false
}
