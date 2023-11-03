import {
  Text,
  Range,
  Transforms,
  Editor,
  Element as SlateElement,
  Node,
  Path as SlatePath,
} from 'slate'
import {
  ObjectSchemaType,
  Path,
  PortableTextBlock,
  PortableTextChild,
  PortableTextObject,
  PortableTextTextBlock,
  SchemaType,
} from '@sanity/types'
import {ReactEditor} from 'slate-react'
import {DOMNode} from 'slate-react/dist/utils/dom'
import {
  EditableAPIDeleteOptions,
  EditorSelection,
  PortableTextMemberSchemaTypes,
  PortableTextSlateEditor,
} from '../../types/editor'
import {toSlateValue, fromSlateValue} from '../../utils/values'
import {toSlateRange, toPortableTextRange} from '../../utils/ranges'
import {PortableTextEditor} from '../PortableTextEditor'

import {debugWithName} from '../../utils/debug'
import {KEY_TO_VALUE_ELEMENT, SLATE_TO_PORTABLE_TEXT_RANGE} from '../../utils/weakMaps'

const debug = debugWithName('API:editable')

export function createWithEditableAPI(
  portableTextEditor: PortableTextEditor,
  types: PortableTextMemberSchemaTypes,
  keyGenerator: () => string,
) {
  return function withEditableAPI(editor: PortableTextSlateEditor): PortableTextSlateEditor {
    portableTextEditor.setEditable({
      focus: (): void => {
        // Make a selection if missing
        if (!editor.selection) {
          const point = {path: [0, 0], offset: 0}
          Transforms.select(editor, {focus: point, anchor: point})
          editor.onChange()
        }
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
      addAnnotation: (
        type: ObjectSchemaType,
        value?: {[prop: string]: unknown},
      ): {spanPath: Path; markDefPath: Path} | undefined => {
        const {selection} = editor
        if (selection) {
          const [block] = Editor.node(editor, selection.focus, {depth: 1})
          if (SlateElement.isElement(block) && block._type === types.block.name) {
            const annotationKey = keyGenerator()
            if (editor.isTextBlock(block)) {
              Transforms.setNodes(
                editor,
                {
                  markDefs: [
                    ...(block.markDefs || []),
                    {_type: type.name, _key: annotationKey, ...value} as PortableTextObject,
                  ],
                },
                {at: selection.focus},
              )
              editor.onChange()
              if (Range.isCollapsed(selection)) {
                editor.pteExpandToWord()
                editor.onChange()
              }
              const [textNode] = Editor.node(editor, selection.focus, {depth: 2})
              if (editor.selection) {
                Editor.withoutNormalizing(editor, () => {
                  // Split if needed
                  Transforms.setNodes(editor, {}, {match: Text.isText, split: true})
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
                    editor.onChange()
                  }
                })
                Editor.normalize(editor)
                editor.onChange()
                const newSelection = toPortableTextRange(
                  fromSlateValue(
                    editor.children,
                    types.block.name,
                    KEY_TO_VALUE_ELEMENT.get(editor),
                  ),
                  editor.selection,
                  types,
                )
                // eslint-disable-next-line max-depth
                if (newSelection && typeof block._key === 'string') {
                  // Insert an empty string to continue writing non-annotated text
                  Editor.withoutNormalizing(editor, () => {
                    if (editor.selection) {
                      Transforms.insertNodes(
                        editor,
                        [{_type: 'span', text: '', marks: [], _key: keyGenerator()}],
                        {
                          at: Range.end(editor.selection),
                        },
                      )
                      editor.onChange()
                    }
                  })
                  return {
                    spanPath: newSelection.focus.path,
                    markDefPath: [{_key: block._key}, 'markDefs', {_key: annotationKey}],
                  }
                }
              }
            }
          }
        }
        return undefined
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
              editor.children = [editor.createPlaceholderBlock()]
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
              // Split the span first
              Transforms.setNodes(editor, {}, {match: Text.isText, split: true})
              editor.onChange()

              // Everything in the selection which has marks
              const spans = [
                ...Editor.nodes(editor, {
                  at: selection,
                  match: (node) =>
                    Text.isText(node) &&
                    node.marks !== undefined &&
                    Array.isArray(node.marks) &&
                    node.marks.length > 0,
                }),
              ]
              spans.forEach(([span, path]) => {
                const [block] = Editor.node(editor, path, {depth: 1})
                if (editor.isTextBlock(block)) {
                  block.markDefs
                    ?.filter((def) => def._type === type.name)
                    .forEach((def) => {
                      if (
                        Text.isText(span) &&
                        Array.isArray(span.marks) &&
                        span.marks.includes(def._key)
                      ) {
                        const newMarks = [...(span.marks || []).filter((mark) => mark !== def._key)]
                        Transforms.setNodes(
                          editor,
                          {
                            marks: newMarks,
                          },
                          {at: path, voids: false, split: false},
                        )
                      }
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
    })
    return editor
  }
}
