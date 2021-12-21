import {Node, Element, Transforms, Editor, Descendant} from 'slate'
import {htmlToBlocks, normalizeBlock} from '@sanity/block-tools'
import {PortableTextFeatures, PortableTextBlock} from '../../types/portableText'
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

    editor.setFragmentData = (data: DataTransfer) => {
      if (editor.selection) {
        debug('Set fragment data')
        const fragment = Node.fragment(editor, editor.selection)
        const portableText = fromSlateValue(fragment, portableTextFeatures.types.block.name)
        const asJSON = JSON.stringify(portableText)
        data.clearData()
        data.setData('application/x-portable-text', asJSON)
        data.setData('application/json', asJSON)
      }
    }

    editor.insertPortableTextData = (data: DataTransfer): boolean => {
      if (!editor.selection) {
        return false
      }
      const pText = data.getData('application/x-portable-text')
      debug('Inserting portable text from clipboard', pText)
      if (pText) {
        const parsed = JSON.parse(pText) as PortableTextBlock[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          const slateValue = regenerateKeys(
            editor,
            toSlateValue(parsed, blockTypeName),
            keyGenerator,
            spanTypeName
          )
          debug('Inserting portable text from clipboard', slateValue)
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
          portableText = htmlToBlocks(
            html,
            portableTextFeatures.types.portableText
          ).map((block: PortableTextBlock) => normalizeBlock(block, {blockTypeName}))
          fragment = toSlateValue(portableText, blockTypeName)
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
          fragment = toSlateValue(portableText, blockTypeName).map((block: PortableTextBlock) =>
            normalizeBlock(block, {blockTypeName})
          )
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
            child._type === spanTypeName
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
