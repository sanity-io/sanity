import {Transforms, Node, Editor, Range} from 'slate'
import {ReactEditor} from '@sanity/slate-react'
import {htmlToBlocks, normalizeBlock} from '@sanity/block-tools'
import {PortableTextFeatures, PortableTextBlock} from '../../types/portableText'
import {EditorChanges, PortableTextSlateEditor} from '../../types/editor'
import {fromSlateValue, toSlateValue, isEqualToEmptyEditor} from '../../utils/values'
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
  return function withInsertData(editor: PortableTextSlateEditor & ReactEditor) {
    const {setFragmentData} = editor
    editor.setFragmentData = (data: DataTransfer) => {
      debug('Set fragment data')
      setFragmentData(data)
    }
    editor.getFragment = () => {
      debug('Get fragment data')
      if (editor.selection) {
        const fragment = Node.fragment(editor, editor.selection).map((node) => {
          const newNode = {...node}
          // Ensure the copy has new keys
          if (newNode.markDefs && Array.isArray(newNode.markDefs)) {
            newNode.markDefs = newNode.markDefs.map((def) => {
              const oldKey = def._key
              const newKey = keyGenerator()
              if (Array.isArray(newNode.children)) {
                newNode.children = newNode.children.map((child) =>
                  child._type === portableTextFeatures.types.span.name
                    ? {
                        ...child,
                        marks: child.marks.includes(oldKey)
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
          const nodeWithNewKeys = {...newNode, _key: keyGenerator()} as Node
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

      const originalSelection = {...editor.selection}
      const isBackward = Range.isBackward(editor.selection)

      if (slateFragment || html || text) {
        let portableText: PortableTextBlock[]
        let fragment: Node[]
        let insertedType

        if (slateFragment) {
          // Slate fragments
          const decoded = decodeURIComponent(window.atob(slateFragment))
          fragment = JSON.parse(decoded) as Node[]
          portableText = fromSlateValue(fragment, portableTextFeatures.types.block.name)
          insertedType = 'Slate Fragment'
        } else if (html) {
          // HTML (TODO: get rid of @sanity/block-tools)
          portableText = htmlToBlocks(html, portableTextFeatures.types.portableText)
            // Ensure it has keys
            .map((block: any) =>
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

        let insertAtPath = editor.selection[isBackward ? 'focus' : 'anchor'].path.slice(0, 1)
        debug(`Inserting ${insertedType} fragment at ${JSON.stringify(insertAtPath)}`, fragment)
        const [focusBlock] = Editor.node(editor, editor.selection, {depth: 1})
        const focusIsVoid = Editor.isVoid(editor, focusBlock)
        if (focusIsVoid) {
          // Insert at path below the void block as we can't insert *into* it.
          insertAtPath = [insertAtPath[0] + 1]
        }
        fragment.forEach((blk, blkIndex) => {
          const {markDefs} = blk
          if (fragment[0] === blk && !focusIsVoid) {
            const isVoid = Editor.isVoid(editor, fragment[0])
            const isEmptyText = isEqualToEmptyEditor([focusBlock], portableTextFeatures)
            if (isEmptyText && isVoid) {
              Transforms.insertFragment(editor, [blk], {
                at: insertAtPath,
              })
              Transforms.removeNodes(editor, {at: insertAtPath})
              if (fragment.length === 1) {
                Transforms.setSelection(editor, {
                  focus: {path: insertAtPath, offset: 0},
                  anchor: {path: insertAtPath, offset: 0},
                })
              }
            } else {
              Transforms.insertFragment(editor, [blk])
            }
            if (!focusIsVoid && !isVoid) {
              // As the first block will be inserted into another block (potentially), mix those markDefs
              Transforms.setNodes(
                editor,
                {
                  markDefs: [
                    ...(Array.isArray(focusBlock.markDefs) ? focusBlock.markDefs : []),
                    ...(Array.isArray(markDefs) ? markDefs : []),
                  ],
                },
                {at: insertAtPath}
              )
              // If the focus block is not empty, use the style from the block.
              if (
                isEmptyText ||
                (originalSelection.anchor.path[0] === 0 &&
                  originalSelection.anchor.path[1] === 0 &&
                  originalSelection.anchor.offset === 0)
              ) {
                Transforms.setNodes(editor, {style: blk.style}, {at: insertAtPath})
              } else {
                Transforms.setNodes(editor, {style: focusBlock.style}, {at: insertAtPath})
              }
            }
          } else {
            if (blkIndex === 1) {
              Transforms.splitNodes(editor)
            }
            Transforms.insertNodes(editor, [blk], {at: insertAtPath, select: true})
          }
          insertAtPath = [insertAtPath[0] + 1]
        })
        change$.next({type: 'loading', isLoading: false})
        editor.onChange()
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
