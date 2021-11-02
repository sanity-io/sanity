import {
  Text,
  Range,
  Transforms,
  Editor,
  Path as SlatePath,
  Element as SlateElement,
  Operation,
  Node,
} from 'slate'
import {isEqual} from 'lodash'
import {Path} from '@sanity/types'
import {ReactEditor} from '@sanity/slate-react'
import {DOMNode} from '@sanity/slate-react/dist/utils/dom'
import {Type} from '../../types/schema'
import {PortableTextBlock, PortableTextChild, PortableTextFeatures} from '../../types/portableText'
import {EditorSelection, PortableTextSlateEditor} from '../../types/editor'
import {toSlateValue, fromSlateValue, isEqualToEmptyEditor} from '../../utils/values'
import {toSlateRange, toPortableTextRange} from '../../utils/ranges'
import {PortableTextEditor} from '../PortableTextEditor'

import {debugWithName} from '../../utils/debug'
import {KEY_TO_VALUE_ELEMENT} from '../../utils/weakMaps'

const debug = debugWithName('API:editable')

export function createWithEditableAPI(
  portableTextEditor: PortableTextEditor,
  portableTextFeatures: PortableTextFeatures,
  keyGenerator: () => string
) {
  return function withEditableAPI(editor: PortableTextSlateEditor & ReactEditor) {
    const {apply} = editor

    // Convert the selection when the operation happens,
    // or we may be out of sync between selection and value
    editor.apply = (operation: Operation) => {
      apply(operation)
    }
    portableTextEditor.setEditable({
      focus: (): void => {
        ReactEditor.focus(editor)
      },
      blur: (): void => {
        ReactEditor.blur(editor)
      },
      toggleMark: (mark: string): void => {
        editor.pteToggleMark(mark)
        ReactEditor.focus(editor)
      },
      toggleList: (listStyle: string): void => {
        editor.pteToggleListItem(listStyle)
        ReactEditor.focus(editor)
      },
      toggleBlockStyle: (blockStyle: string): void => {
        editor.pteToggleBlockStyle(blockStyle)
        ReactEditor.focus(editor)
      },
      isMarkActive: (mark: string): boolean => {
        // Try/catch this, as Slate may error because the selection is currently wrong
        // TODO: catch only relevant error from Slate
        try {
          return editor.pteIsMarkActive(mark)
        } catch (err) {
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
        const isEmpty = isEqualToEmptyEditor(editor.children, portableTextFeatures) // TODO: check up on this
        if (isEmpty || selection === null) {
          debug('No value or selection is null, deselecting')
          Transforms.deselect(editor)
          return
        }
        const slateSelection = toSlateRange(selection, editor)
        if (slateSelection) {
          const [node] = Editor.node(editor, slateSelection)
          if (Editor.isVoid(editor, node)) {
            Transforms.select(editor, slateSelection.focus.path.concat(0))
          } else {
            Transforms.select(editor, slateSelection)
          }
          ReactEditor.focus(editor)
        }
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
              const pseudoBlock = {
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
          portableTextFeatures.types.block.name
        )[0] as unknown) as SlateElement
        const child = block.children[0]
        Editor.insertNode(editor, child)
        editor.onChange()
        return toPortableTextRange(editor)?.focus.path || []
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
          portableTextFeatures.types.block.name
        )[0] as unknown) as Node
        Editor.insertNode(editor, block)
        editor.onChange()
        return toPortableTextRange(editor)?.focus.path || []
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
            Editor.nodes(editor, {at: [], match: (n) => n._key === element._key}) || []
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
            if (block && Array.isArray(block.markDefs)) {
              block.markDefs.forEach((def) => {
                if (span.marks && Array.isArray(span.marks) && span.marks.includes(def._key)) {
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
        value?: {[prop: string]: any}
      ): {spanPath: Path; markDefPath: Path} | undefined => {
        const {selection} = editor
        if (selection) {
          const [blockElement] = Editor.node(editor, selection.focus, {depth: 1})
          if (blockElement._type === portableTextFeatures.types.block.name) {
            const annotationKey = keyGenerator()
            if (Array.isArray(blockElement.markDefs)) {
              Transforms.setNodes(
                editor,
                {
                  markDefs: [
                    ...blockElement.markDefs,
                    {_type: type.name, _key: annotationKey, ...value},
                  ],
                },
                {at: selection.focus}
              )
              if (Range.isCollapsed(selection)) {
                editor.pteExpandToWord()
              }
              const [textNode] = Editor.node(editor, selection.focus, {depth: 2})
              if (editor.selection) {
                Editor.withoutNormalizing(editor, () => {
                  // Split if needed
                  Transforms.setNodes(editor, {}, {match: Text.isText, split: true})
                  if (editor.selection) {
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
                  }
                })
                Editor.normalize(editor)
                editor.onChange()
                const newSelection = toPortableTextRange(editor)
                // eslint-disable-next-line max-depth
                if (newSelection && typeof blockElement._key === 'string') {
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
                    markDefPath: [{_key: blockElement._key}, 'markDefs', {_key: annotationKey}],
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
            const ptMode: string | undefined = (options && options.mode) || undefined
            let mode: 'highest' | 'lowest' = 'highest'
            if (ptMode) {
              mode = ptMode === 'block' ? 'highest' : 'lowest'
            }
            Transforms.removeNodes(editor, {at: range, mode})
          }
        }
      },
      removeAnnotation: (type: Type): void => {
        let {selection} = editor
        let changed = false
        if (selection) {
          // Select the whole annotation if collapsed
          if (Range.isCollapsed(selection)) {
            const [node, nodePath] = Editor.node(editor, selection, {depth: 2})
            if (node && node.marks && typeof node.text === 'string') {
              Transforms.select(editor, nodePath)
              selection = editor.selection
            }
          }
          // Do this without normalization or span references will be unstable!
          Editor.withoutNormalizing(editor, () => {
            if (selection && Range.isExpanded(selection)) {
              // Split the span first
              Transforms.setNodes(editor, {}, {match: Text.isText, split: true})
              selection = editor.selection
              if (!selection) {
                return
              }
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
                if (block && Array.isArray(block.markDefs)) {
                  block.markDefs
                    .filter((def) => def._type === type.name)
                    .forEach((def) => {
                      if (Array.isArray(span.marks) && span.marks.includes(def._key)) {
                        const newMarks = [...(span.marks || []).filter((mark) => mark !== def._key)]
                        Transforms.setNodes(
                          editor,
                          {
                            marks: newMarks,
                          },
                          {at: path, voids: false, split: false}
                        )
                      }
                      changed = true
                    })
                }
              })
            }
          })
          if (changed) {
            editor.onChange()
          }
        }
      },
      getSelection: () => {
        return toPortableTextRange(editor)
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
