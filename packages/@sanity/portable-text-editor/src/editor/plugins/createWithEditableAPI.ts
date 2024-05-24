import {
  isPortableTextSpan,
  type ObjectSchemaType,
  type Path,
  type PortableTextBlock,
  type PortableTextChild,
  type PortableTextObject,
  type PortableTextTextBlock,
  type SchemaType,
} from '@sanity/types'
import {Editor, Element as SlateElement, Node, Range, Text, Transforms} from 'slate'
import {ReactEditor} from 'slate-react'
import {type DOMNode} from 'slate-react/dist/utils/dom'

import {
  type EditableAPIDeleteOptions,
  type EditorSelection,
  type PortableTextMemberSchemaTypes,
  type PortableTextSlateEditor,
} from '../../types/editor'
import {debugWithName} from '../../utils/debug'
import {toPortableTextRange, toSlateRange} from '../../utils/ranges'
import {fromSlateValue, isEqualToEmptyEditor, toSlateValue} from '../../utils/values'
import {KEY_TO_VALUE_ELEMENT, SLATE_TO_PORTABLE_TEXT_RANGE} from '../../utils/weakMaps'
import {type PortableTextEditor} from '../PortableTextEditor'

const debug = debugWithName('API:editable')

export function createWithEditableAPI(
  portableTextEditor: PortableTextEditor,
  types: PortableTextMemberSchemaTypes,
  keyGenerator: () => string,
) {
  return function withEditableAPI(editor: PortableTextSlateEditor): PortableTextSlateEditor {
    portableTextEditor.setEditable({
      focus: (): void => {
        ReactEditor.focus(editor)
      },
      blur: (): void => {
        ReactEditor.blur(editor)
      },
      toggleMark: (mark: string): void => {
        editor.pteToggleMark(mark)
      },
      toggleList: (listStyle: string): void => {
        editor.pteToggleListItem(listStyle)
      },
      toggleBlockStyle: (blockStyle: string): void => {
        editor.pteToggleBlockStyle(blockStyle)
      },
      isMarkActive: (mark: string): boolean => {
        // Try/catch this, as Slate may error because the selection is currently wrong
        // TODO: catch only relevant error from Slate
        try {
          return editor.pteIsMarkActive(mark)
        } catch (err) {
          console.warn(err)
          return false
        }
      },
      marks: (): string[] => {
        return (
          {
            ...(Editor.marks(editor) || {}),
          }.marks || []
        )
      },
      undo: (): void => editor.undo(),
      redo: (): void => editor.redo(),
      select: (selection: EditorSelection): void => {
        const slateSelection = toSlateRange(selection, editor)
        if (slateSelection) {
          Transforms.select(editor, slateSelection)
        } else {
          Transforms.deselect(editor)
        }
        editor.onChange()
      },
      focusBlock: (): PortableTextBlock | undefined => {
        if (editor.selection) {
          const block = Node.descendant(editor, editor.selection.focus.path.slice(0, 1))
          if (block) {
            return fromSlateValue([block], types.block.name, KEY_TO_VALUE_ELEMENT.get(editor))[0]
          }
        }
        return undefined
      },
      focusChild: (): PortableTextChild | undefined => {
        if (editor.selection) {
          const block = Node.descendant(editor, editor.selection.focus.path.slice(0, 1))
          if (block && editor.isTextBlock(block)) {
            const ptBlock = fromSlateValue(
              [block],
              types.block.name,
              KEY_TO_VALUE_ELEMENT.get(editor),
            )[0] as PortableTextTextBlock
            return ptBlock.children[editor.selection.focus.path[1]]
          }
        }
        return undefined
      },
      insertChild: (type: SchemaType, value?: {[prop: string]: any}): Path => {
        if (!editor.selection) {
          throw new Error('The editor has no selection')
        }
        const [focusBlock] = Array.from(
          Editor.nodes(editor, {
            at: editor.selection.focus.path.slice(0, 1),
            match: (n) => n._type === types.block.name,
          }),
        )[0] || [undefined]
        if (!focusBlock) {
          throw new Error('No focused text block')
        }
        if (
          type.name !== types.span.name &&
          !types.inlineObjects.some((t) => t.name === type.name)
        ) {
          throw new Error('This type cannot be inserted as a child to a text block')
        }
        const block = toSlateValue(
          [
            {
              _key: keyGenerator(),
              _type: types.block.name,
              children: [
                {
                  _key: keyGenerator(),
                  _type: type.name,
                  ...(value ? value : {}),
                },
              ],
            },
          ],
          portableTextEditor,
        )[0] as unknown as SlateElement
        const child = block.children[0]
        const focusChildPath = editor.selection.focus.path.slice(0, 2)
        const isSpanNode = child._type === types.span.name
        const focusNode = Node.get(editor, focusChildPath)

        // If we are inserting a span, and currently have focus on an inline object,
        // move the selection to the next span (guaranteed by normalizing rules) before inserting it.
        if (isSpanNode && focusNode._type !== types.span.name) {
          debug('Inserting span child next to inline object child, moving selection + 1')
          editor.move({distance: 1, unit: 'character'})
        }

        Transforms.insertNodes(editor, child, {
          select: true,
          at: editor.selection,
        })
        editor.onChange()
        return (
          toPortableTextRange(
            fromSlateValue(editor.children, types.block.name, KEY_TO_VALUE_ELEMENT.get(editor)),
            editor.selection,
            types,
          )?.focus.path || []
        )
      },
      insertBlock: (type: SchemaType, value?: {[prop: string]: any}): Path => {
        if (!editor.selection) {
          throw new Error('The editor has no selection')
        }
        const block = toSlateValue(
          [
            {
              _key: keyGenerator(),
              _type: type.name,
              ...(value ? value : {}),
            },
          ],
          portableTextEditor,
        )[0] as unknown as Node
        const [focusBlock] = Array.from(
          Editor.nodes(editor, {
            at: editor.selection.focus.path.slice(0, 1),
            match: (n) => n._type === types.block.name,
          }),
        )[0] || [undefined]

        const isEmptyTextBlock = focusBlock && isEqualToEmptyEditor([focusBlock], types)

        if (isEmptyTextBlock) {
          // If the text block is empty, remove it before inserting the new block.
          Transforms.removeNodes(editor, {at: editor.selection})
        }

        Editor.insertNode(editor, block)
        editor.onChange()
        return (
          toPortableTextRange(
            fromSlateValue(editor.children, types.block.name, KEY_TO_VALUE_ELEMENT.get(editor)),
            editor.selection,
            types,
          )?.focus.path || []
        )
      },
      hasBlockStyle: (style: string): boolean => {
        try {
          return editor.pteHasBlockStyle(style)
        } catch (err) {
          // This is fine.
          // debug(err)
          return false
        }
      },
      hasListStyle: (listStyle: string): boolean => {
        try {
          return editor.pteHasListStyle(listStyle)
        } catch (err) {
          // This is fine.
          // debug(err)
          return false
        }
      },
      isVoid: (element: PortableTextBlock | PortableTextChild) => {
        return ![types.block.name, types.span.name].includes(element._type)
      },
      findByPath: (
        path: Path,
      ): [PortableTextBlock | PortableTextChild | undefined, Path | undefined] => {
        const slatePath = toSlateRange(
          {focus: {path, offset: 0}, anchor: {path, offset: 0}},
          editor,
        )
        if (slatePath) {
          const [block, blockPath] = Editor.node(editor, slatePath.focus.path.slice(0, 1))
          if (block && blockPath && typeof block._key === 'string') {
            if (path.length === 1 && slatePath.focus.path.length === 1) {
              return [fromSlateValue([block], types.block.name)[0], [{_key: block._key}]]
            }
            const ptBlock = fromSlateValue(
              [block],
              types.block.name,
              KEY_TO_VALUE_ELEMENT.get(editor),
            )[0]
            if (editor.isTextBlock(ptBlock)) {
              const ptChild = ptBlock.children[slatePath.focus.path[1]]
              if (ptChild) {
                return [ptChild, [{_key: block._key}, 'children', {_key: ptChild._key}]]
              }
            }
          }
        }
        return [undefined, undefined]
      },
      findDOMNode: (element: PortableTextBlock | PortableTextChild): DOMNode | undefined => {
        let node: DOMNode | undefined
        try {
          const [item] = Array.from(
            Editor.nodes(editor, {
              at: [],
              match: (n) => n._key === element._key,
            }) || [],
          )[0] || [undefined]
          node = ReactEditor.toDOMNode(editor, item)
        } catch (err) {
          // Nothing
        }
        return node
      },
      activeAnnotations: (): PortableTextObject[] => {
        if (!editor.selection || editor.selection.focus.path.length < 2) {
          return []
        }
        try {
          const activeAnnotations: PortableTextObject[] = []
          const spans = Editor.nodes(editor, {
            at: editor.selection,
            match: (node) =>
              Text.isText(node) &&
              node.marks !== undefined &&
              Array.isArray(node.marks) &&
              node.marks.length > 0,
          })
          for (const [span, path] of spans) {
            const [block] = Editor.node(editor, path, {depth: 1})
            if (editor.isTextBlock(block)) {
              block.markDefs?.forEach((def) => {
                if (
                  Text.isText(span) &&
                  span.marks &&
                  Array.isArray(span.marks) &&
                  span.marks.includes(def._key)
                ) {
                  activeAnnotations.push(def)
                }
              })
            }
          }
          return activeAnnotations
        } catch (err) {
          return []
        }
      },
      isAnnotationActive: (annotationType: PortableTextObject['_type']): boolean => {
        if (!editor.selection || editor.selection.focus.path.length < 2) {
          return false
        }

        try {
          const spans = [
            ...Editor.nodes(editor, {
              at: editor.selection,
              match: (node) => Text.isText(node),
            }),
          ]

          if (
            spans.some(
              ([span]) => !isPortableTextSpan(span) || !span.marks || span.marks?.length === 0,
            )
          )
            return false

          const selectionMarkDefs = spans.reduce((accMarkDefs, [, path]) => {
            const [block] = Editor.node(editor, path, {depth: 1})
            if (editor.isTextBlock(block) && block.markDefs) {
              return [...accMarkDefs, ...block.markDefs]
            }
            return accMarkDefs
          }, [] as PortableTextObject[])

          return spans.every(([span]) => {
            if (!isPortableTextSpan(span)) return false

            const spanMarkDefs = span.marks?.map(
              (markKey) => selectionMarkDefs.find((def) => def?._key === markKey)?._type,
            )

            return spanMarkDefs?.includes(annotationType)
          })
        } catch (err) {
          return false
        }
      },
      addAnnotation: (
        type: ObjectSchemaType,
        value?: {[prop: string]: unknown},
      ): {spanPath: Path; markDefPath: Path} | undefined => {
        const {selection: originalSelection} = editor
        let returnValue: {spanPath: Path; markDefPath: Path} | undefined = undefined
        if (originalSelection) {
          const [block] = Editor.node(editor, originalSelection.focus, {depth: 1})
          if (!editor.isTextBlock(block)) {
            return undefined
          }
          if (Range.isCollapsed(originalSelection)) {
            editor.pteExpandToWord()
            editor.onChange()
          }
          const [textNode] = Editor.node(editor, originalSelection.focus, {depth: 2})

          // If we still have a selection, add the annotation to the selected text
          if (editor.selection) {
            Editor.withoutNormalizing(editor, () => {
              // Add markDefs to the block
              const annotationKey = keyGenerator()
              Transforms.setNodes(
                editor,
                {
                  markDefs: [
                    ...(block.markDefs || []),
                    {_type: type.name, _key: annotationKey, ...value} as PortableTextObject,
                  ],
                },
                {at: originalSelection.focus},
              )
              editor.onChange()

              // Split if needed
              Transforms.setNodes(editor, {}, {match: Text.isText, split: true})
              editor.onChange()

              // Add marks to the span node
              if (editor.selection && Text.isText(textNode)) {
                Transforms.setNodes(
                  editor,
                  {
                    marks: [...((textNode.marks || []) as string[]), annotationKey],
                  },
                  {
                    at: editor.selection,
                    match: (n) => n._type === types.span.name,
                  },
                )
              }
              editor.onChange()
              if (editor.selection) {
                // Insert an empty string to continue writing non-annotated text
                Transforms.insertNodes(
                  editor,
                  [{_type: 'span', text: '', marks: [], _key: keyGenerator()}],
                  {
                    at: Range.end(editor.selection),
                  },
                )
              }
              const newPortableTextEditorSelection = toPortableTextRange(
                fromSlateValue(editor.children, types.block.name, KEY_TO_VALUE_ELEMENT.get(editor)),
                editor.selection,
                types,
              )
              if (newPortableTextEditorSelection) {
                returnValue = {
                  spanPath: newPortableTextEditorSelection.focus.path,
                  markDefPath: [{_key: block._key}, 'markDefs', {_key: annotationKey}],
                }
              }
            })
            Editor.normalize(editor)
            editor.onChange()
          }
        }
        return returnValue
      },
      delete: (selection: EditorSelection, options?: EditableAPIDeleteOptions): void => {
        if (selection) {
          const range = toSlateRange(selection, editor)
          const hasRange = range && range.anchor.path.length > 0 && range.focus.path.length > 0
          if (!hasRange) {
            throw new Error('Invalid range')
          }
          if (range) {
            if (!options?.mode || options?.mode === 'selected') {
              debug(`Deleting content in selection`)
              Transforms.delete(editor, {
                at: range,
                hanging: true,
                voids: true,
              })
              editor.onChange()
              return
            }
            if (options?.mode === 'blocks') {
              debug(`Deleting blocks touched by selection`)
              Transforms.removeNodes(editor, {
                at: range,
                voids: true,
                match: (node) => {
                  return (
                    editor.isTextBlock(node) ||
                    (!editor.isTextBlock(node) && SlateElement.isElement(node))
                  )
                },
              })
            }
            if (options?.mode === 'children') {
              debug(`Deleting children touched by selection`)
              Transforms.removeNodes(editor, {
                at: range,
                voids: true,
                match: (node) => {
                  return (
                    node._type === types.span.name || // Text children
                    (!editor.isTextBlock(node) && SlateElement.isElement(node)) // inline blocks
                  )
                },
              })
            }
            // If the editor was emptied, insert a placeholder block
            // directly into the editor's children. We don't want to do this
            // through a Transform (because that would trigger a change event
            // that would insert the placeholder into the actual value
            // which should remain empty)
            if (editor.children.length === 0) {
              editor.children = [editor.pteCreateEmptyBlock()]
            }
            editor.onChange()
          }
        }
      },
      removeAnnotation: (type: ObjectSchemaType): void => {
        let {selection} = editor
        debug('Removing annotation', type)
        if (selection) {
          // Select the whole annotation if collapsed
          if (Range.isCollapsed(selection)) {
            const [node, nodePath] = Editor.node(editor, selection, {depth: 2})
            if (Text.isText(node) && node.marks && typeof node.text === 'string') {
              Transforms.select(editor, nodePath)
              selection = editor.selection
            }
          }
          // Do this without normalization or span references will be unstable!
          Editor.withoutNormalizing(editor, () => {
            if (selection && Range.isExpanded(selection)) {
              selection = editor.selection
              if (!selection) {
                return
              }
              // Find the selected block, to identify the annotation to remove
              const blocks = [
                ...Editor.nodes(editor, {
                  at: selection,
                  match: (node) => {
                    return (
                      editor.isTextBlock(node) &&
                      Array.isArray(node.markDefs) &&
                      node.markDefs.some((def) => def._type === type.name)
                    )
                  },
                }),
              ]
              const removedMarks: string[] = []

              // Removes the marks from the text nodes
              blocks.forEach(([block]) => {
                if (editor.isTextBlock(block) && Array.isArray(block.markDefs)) {
                  const marksToRemove = block.markDefs.filter((def) => def._type === type.name)
                  marksToRemove.forEach((def) => {
                    if (!removedMarks.includes(def._key)) removedMarks.push(def._key)
                    Editor.removeMark(editor, def._key)
                  })
                }
              })
            }
          })
          Editor.normalize(editor)
          editor.onChange()
        }
      },
      getSelection: (): EditorSelection | null => {
        let ptRange: EditorSelection = null
        if (editor.selection) {
          const existing = SLATE_TO_PORTABLE_TEXT_RANGE.get(editor.selection)
          if (existing) {
            return existing
          }
          ptRange = toPortableTextRange(
            fromSlateValue(editor.children, types.block.name, KEY_TO_VALUE_ELEMENT.get(editor)),
            editor.selection,
            types,
          )
          SLATE_TO_PORTABLE_TEXT_RANGE.set(editor.selection, ptRange)
        }
        return ptRange
      },
      getValue: () => {
        return fromSlateValue(editor.children, types.block.name, KEY_TO_VALUE_ELEMENT.get(editor))
      },
      isCollapsedSelection: () => {
        return !!editor.selection && Range.isCollapsed(editor.selection)
      },
      isExpandedSelection: () => {
        return !!editor.selection && Range.isExpanded(editor.selection)
      },
      insertBreak: () => {
        editor.insertBreak()
        editor.onChange()
      },
      getFragment: () => {
        return fromSlateValue(editor.getFragment(), types.block.name)
      },
      isSelectionsOverlapping: (selectionA: EditorSelection, selectionB: EditorSelection) => {
        // Convert the selections to Slate ranges
        const rangeA = toSlateRange(selectionA, editor)
        const rangeB = toSlateRange(selectionB, editor)

        // Make sure the ranges are valid
        const isValidRanges = Range.isRange(rangeA) && Range.isRange(rangeB)

        // Check if the ranges are overlapping
        const isOverlapping = isValidRanges && Range.includes(rangeA, rangeB)

        return isOverlapping
      },
    })
    return editor
  }
}
