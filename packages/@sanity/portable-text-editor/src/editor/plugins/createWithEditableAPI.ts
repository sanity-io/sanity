import {Text, Range, Transforms, Editor, Element as SlateElement, Node} from 'slate'
import {Path} from '@sanity/types'
import {ReactEditor} from '@sanity/slate-react'
import {DOMNode} from '@sanity/slate-react/dist/utils/dom'
import {Type} from '../../types/schema'
import {PortableTextBlock, PortableTextChild, PortableTextFeatures} from '../../types/portableText'
import {EditorSelection, PortableTextSlateEditor} from '../../types/editor'
import {toSlateValue, fromSlateValue} from '../../utils/values'
import {toSlateRange, toPortableTextRange} from '../../utils/ranges'
import {PortableTextEditor} from '../PortableTextEditor'

import {debugWithName} from '../../utils/debug'
import {KEY_TO_VALUE_ELEMENT, SLATE_TO_PORTABLE_TEXT_RANGE} from '../../utils/weakMaps'

const debug = debugWithName('API:editable')

export function createWithEditableAPI(
  portableTextEditor: PortableTextEditor,
  portableTextFeatures: PortableTextFeatures,
  keyGenerator: () => string
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
          // Try/catch this, as Slate may error because the selection is currently wrong
          // TODO: catch only relevant error from Slate
          try {
            const [block] = Array.from(
              Editor.nodes(editor, {
                at: editor.selection.focus,
                match: (n) => Editor.isBlock(editor, n),
              })
            )[0] || [undefined]
            if (block) {
              return fromSlateValue(
                [block],
                portableTextFeatures.types.block.name,
                KEY_TO_VALUE_ELEMENT.get(editor)
              )[0]
            }
          } catch (err) {
            return undefined
          }
        }
        return undefined
      },
      focusChild: (): PortableTextChild | undefined => {
        if (editor.selection) {
          try {
            const [node] = Array.from(
              Editor.nodes(editor, {
                mode: 'lowest',
                at: editor.selection.focus,
                match: (n) => n._type !== undefined,
                voids: true,
              })
            )[0] || [undefined]
            if (node && !Editor.isBlock(editor, node)) {
              const pseudoBlock: PortableTextBlock = {
                _key: 'pseudo',
                _type: portableTextFeatures.types.block.name,
                children: [node],
              }
              return fromSlateValue(
                [pseudoBlock],
                portableTextFeatures.types.block.name,
                KEY_TO_VALUE_ELEMENT.get(editor)
              )[0].children[0]
            }
          } catch (err) {
            return undefined
          }
        }
        return undefined
      },
      insertChild: (type: Type, value?: {[prop: string]: any}): Path => {
        if (!editor.selection) {
          throw new Error('The editor has no selection')
        }
        const [focusBlock] = Array.from(
          Editor.nodes(editor, {
            at: editor.selection.focus,
            match: (n) => Editor.isBlock(editor, n),
          })
        )[0] || [undefined]
        if (!focusBlock) {
          throw new Error('No focus block')
        }
        if (focusBlock && Editor.isVoid(editor, focusBlock)) {
          throw new Error("Can't insert childs into block objects")
        }
        const block = (toSlateValue(
          [
            {
              _key: keyGenerator(),
              _type: portableTextFeatures.types.block.name,
              children: [
                {
                  _key: keyGenerator(),
                  _type: type.name,
                  ...(value ? value : {}),
                },
              ],
            },
          ],
          portableTextEditor
        )[0] as unknown) as SlateElement
        const child = block.children[0]
        Editor.insertNode(editor, child as Node)
        editor.onChange()
        return toPortableTextRange(editor, editor.selection)?.focus.path || []
      },
      insertBlock: (type: Type, value?: {[prop: string]: any}): Path => {
        if (!editor.selection) {
          throw new Error('The editor has no selection')
        }
        const block = (toSlateValue(
          [
            {
              _key: keyGenerator(),
              _type: type.name,
              ...(value ? value : {}),
            },
          ],
          portableTextEditor
        )[0] as unknown) as Node
        Editor.insertNode(editor, block)
        editor.onChange()
        return toPortableTextRange(editor, editor.selection)?.focus.path || []
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
        return ![
          portableTextFeatures.types.block.name,
          portableTextFeatures.types.span.name,
        ].includes(element._type)
      },
      findByPath: (
        path: Path
      ): [PortableTextBlock | PortableTextChild | undefined, Path | undefined] => {
        const slatePath = toSlateRange(
          {focus: {path, offset: 0}, anchor: {path, offset: 0}},
          editor
        )
        if (slatePath) {
          const [block, blockPath] = Editor.node(editor, slatePath.focus.path.slice(0, 1))
          if (block && blockPath && typeof block._key === 'string') {
            if (path.length === 1 && slatePath.focus.path.length === 1) {
              return [
                fromSlateValue([block], portableTextFeatures.types.block.name)[0],
                [{_key: block._key}],
              ]
            }
            const ptBlock = fromSlateValue(
              [block],
              portableTextFeatures.types.block.name,
              KEY_TO_VALUE_ELEMENT.get(editor)
            )[0]
            const ptChild = ptBlock.children[slatePath.focus.path[1]]
            if (ptChild) {
              return [ptChild, [{_key: block._key}, 'children', {_key: ptChild._key}]]
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
            }) || []
          )[0] || [undefined]
          node = ReactEditor.toDOMNode(editor, item)
        } catch (err) {
          // Nothing
        }
        return node
      },
      activeAnnotations: (): PortableTextBlock[] => {
        if (!editor.selection || editor.selection.focus.path.length < 2) {
          return []
        }
        try {
          const activeAnnotations: PortableTextBlock[] = []
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
              block.markDefs.forEach((def) => {
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
        type: Type,
        value?: {[prop: string]: PortableTextBlock}
      ): {spanPath: Path; markDefPath: Path} | undefined => {
        const {selection} = editor
        if (selection) {
          const [block] = Editor.node(editor, selection.focus, {depth: 1})
          if (
            SlateElement.isElement(block) &&
            block._type === portableTextFeatures.types.block.name
          ) {
            const annotationKey = keyGenerator()
            if (editor.isTextBlock(block)) {
              Transforms.setNodes(
                editor,
                {
                  markDefs: [...block.markDefs, {_type: type.name, _key: annotationKey, ...value}],
                },
                {at: selection.focus}
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
                        match: (n) => n._type === portableTextFeatures.types.span.name,
                      }
                    )
                    editor.onChange()
                  }
                })
                Editor.normalize(editor)
                editor.onChange()
                const newSelection = toPortableTextRange(editor, editor.selection)
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
                        }
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
      delete: (selection?: EditorSelection, options?: {mode?: 'block' | 'children'}): void => {
        if (selection) {
          const range = toSlateRange(selection, editor)
          if (range) {
            const nodes = Editor.nodes(editor, {
              at: range,
              match: (node) => {
                if (options?.mode === 'block') {
                  debug(`Deleting blocks from selection`)
                  return (
                    editor.isTextBlock(node) ||
                    (!editor.isTextBlock(node) && SlateElement.isElement(node))
                  )
                }
                debug(`Deleting children from selection`)
                return (
                  node._type === portableTextFeatures.types.span.name || // Text children
                  (!editor.isTextBlock(node) && SlateElement.isElement(node)) // inline blocks
                )
              },
            })
            const nodeAndPaths = [...nodes]
            nodeAndPaths.forEach(([, p]) => {
              Transforms.removeNodes(editor, {
                at: p,
                voids: true,
                hanging: true,
              })
            })
            editor.onChange()
          }
        }
      },
      removeAnnotation: (type: Type): void => {
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
                    .filter((def) => def._type === type.name)
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
                          {at: path, voids: false, split: false}
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
          ptRange = toPortableTextRange(editor, editor.selection)
          SLATE_TO_PORTABLE_TEXT_RANGE.set(editor.selection, ptRange)
        }
        return ptRange
      },
      getValue: () => {
        return fromSlateValue(
          editor.children,
          portableTextFeatures.types.block.name,
          KEY_TO_VALUE_ELEMENT.get(editor)
        )
      },
      isCollapsedSelection: () => {
        return !!editor.selection && Range.isCollapsed(editor.selection)
      },
      isExpandedSelection: () => {
        return !!editor.selection && Range.isExpanded(editor.selection)
      },
    })
    return editor
  }
}
