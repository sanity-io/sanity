import {Node, Element, Transforms, Editor} from 'slate'
import {htmlToBlocks, normalizeBlock} from '@sanity/block-tools'
import {PortableTextFeatures, PortableTextBlock} from '../../types/portableText'
import {EditorChanges, PortableTextSlateEditor} from '../../types/editor'
import {fromSlateValue, toSlateValue} from '../../utils/values'
import {validateValue} from '../../utils/validateValue'
import {debugWithName} from '../../utils/debug'

const debug = debugWithName('plugin:withInsertData')

/**
 * This plugin handles pasting and drag/drop to the editor
 *
 */
export function createWithInsertData(
  change$: EditorChanges,
  portableTextFeatures: PortableTextFeatures,
  keyGenerator: () => string
) {
  return function withInsertData(editor: PortableTextSlateEditor): PortableTextSlateEditor {
    editor.getFragment = () => {
      debug('Get fragment data')
      if (editor.selection) {
        const fragment = Node.fragment(editor, editor.selection).map((node) => {
          const newNode: Element = {...(node as Element)}
          // Ensure the copy has new keys
          if (editor.isTextBlock(newNode)) {
            newNode.markDefs = newNode.markDefs.map((def) => {
              const oldKey = def._key
              const newKey = keyGenerator()
              if (Array.isArray(newNode.children)) {
                newNode.children = newNode.children.map((child) =>
                  child._type === portableTextFeatures.types.span.name
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
          if (Array.isArray(nodeWithNewKeys.children)) {
            nodeWithNewKeys.children = nodeWithNewKeys.children.map((child) => ({
              ...child,
              _key: keyGenerator(),
            }))
          }
          return nodeWithNewKeys
        })
        return fragment
      }
      return []
    }

    editor.insertData = (data) => {
      if (!editor.selection) {
        debug('No selection, not inserting')
        return
      }

      change$.next({type: 'loading', isLoading: true}) // This could potenitally take some time

      const html = data.getData('text/html')
      const slateFragment = data.getData('application/x-slate-fragment')
      const text = data.getData('text/plain')

      // TODO: support application/x-portable-text ?
      // const portableText = data.getData('application/x-portable-text')
      // if (portableText) {
      //   const parsed = JSON.parse(portableText)
      //   if (Array.isArray(parsed) && parsed.length > 0) {
      //     debug('inserting portable text', parsed)
      //     return true
      //   }
      // }

      if (slateFragment || html || text) {
        let portableText: PortableTextBlock[]
        let fragment: Node[]
        let insertedType

        if (slateFragment) {
          // Slate fragments
          const decoded = decodeURIComponent(window.atob(slateFragment))
          fragment = JSON.parse(decoded) as Node[]
          portableText = fromSlateValue(fragment, portableTextFeatures.types.block.name)
          insertedType = 'fragment'
        } else if (html) {
          portableText = htmlToBlocks(html, portableTextFeatures.types.portableText)
            // Ensure it has keys
            .map((block: PortableTextBlock) =>
              normalizeBlock(block, {blockTypeName: portableTextFeatures.types.block.name})
            )
          fragment = (toSlateValue(
            portableText,
            portableTextFeatures.types.block.name
          ) as unknown) as Node[]
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
          portableText = htmlToBlocks(textToHtml, portableTextFeatures.types.portableText)
          fragment = (toSlateValue(
            portableText,
            portableTextFeatures.types.block.name
          ) as unknown) as Node[]
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
          return
        }

        debug(`Inserting ${insertedType} fragment at ${JSON.stringify(editor.selection)}`)
        const [focusBlock] = Editor.node(editor, editor.selection, {depth: 1})
        if (editor.isTextBlock(focusBlock) && editor.isTextBlock(fragment[0])) {
          debug('Mixing markDefs of focusBlock and frament[0] block')
          const {markDefs} = focusBlock
          // As the first block will be inserted into another block (potentially), mix those markDefs
          Transforms.setNodes(
            editor,
            {
              markDefs: [...fragment[0].markDefs, ...markDefs],
            },
            {at: editor.selection}
          )
        }
        editor.insertFragment(fragment)
        change$.next({type: 'loading', isLoading: false})
        return
      }
      change$.next({type: 'loading', isLoading: false})
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
