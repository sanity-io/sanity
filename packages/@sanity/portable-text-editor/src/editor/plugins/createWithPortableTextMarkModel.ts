/* eslint-disable complexity */
/**
 *
 * This plugin will change Slate's default marks model (every prop is a mark) with the Portable Text model (marks is an array of strings on prop .marks).
 *
 */

import {isEqual, flatten, uniq} from 'lodash'
import {Editor, Range, Transforms, Text, Path, NodeEntry, Element} from 'slate'

import {debugWithName} from '../../utils/debug'
import {PortableTextSlateEditor} from '../../types/editor'
import {PortableTextFeatures} from '../../types/portableText'

const debug = debugWithName('plugin:withPortableTextMarkModel')

export function createWithPortableTextMarkModel(
  portableTextFeatures: PortableTextFeatures,
  keyGenerator: () => string
): (editor: PortableTextSlateEditor) => PortableTextSlateEditor {
  return function withPortableTextMarkModel(editor: PortableTextSlateEditor) {
    const {apply, normalizeNode} = editor
    const decorators = portableTextFeatures.decorators.map((t) => t.value)

    // Extend Slate's default normalization. Merge spans with same set of .marks when doing merge_node operations, and clean up markDefs / marks
    editor.normalizeNode = (nodeEntry) => {
      normalizeNode(nodeEntry)
      if (
        editor.operations.some((op) =>
          [
            'insert_node',
            'insert_text',
            'merge_node',
            'remove_node',
            'remove_text',
            'set_node',
          ].includes(op.type)
        )
      ) {
        mergeSpans(editor)
      }
      const [node, path] = nodeEntry
      const isSpan = Text.isText(node) && node._type === portableTextFeatures.types.span.name
      const isTextBlock = editor.isTextBlock(node)
      if (isSpan || isTextBlock) {
        if (!isTextBlock && !Array.isArray(node.marks)) {
          debug('Adding .marks to span node')
          Transforms.setNodes(editor, {marks: []}, {at: path})
          editor.onChange()
        }
        for (const op of editor.operations) {
          // Make sure markDefs are copied over when merging two blocks.
          if (
            op.type === 'merge_node' &&
            op.path.length === 1 &&
            'markDefs' in op.properties &&
            op.properties._type === portableTextFeatures.types.block.name &&
            Array.isArray(op.properties.markDefs) &&
            op.properties.markDefs.length > 0 &&
            op.path[0] - 1 >= 0
          ) {
            const [targetBlock, targetPath] = Editor.node(editor, [op.path[0] - 1])
            debug(`Copying markDefs over to merged block`, op)
            if (editor.isTextBlock(targetBlock)) {
              const oldDefs = (Array.isArray(targetBlock.markDefs) && targetBlock.markDefs) || []
              const newMarkDefs = uniq([...oldDefs, ...op.properties.markDefs])
              const isNormalized = isEqual(newMarkDefs, targetBlock.markDefs)
              // eslint-disable-next-line max-depth
              if (!isNormalized) {
                Transforms.setNodes(editor, {markDefs: newMarkDefs}, {at: targetPath, voids: false})
                editor.onChange()
              }
            }
          }
          // Make sure markDefs are copied over to new block when splitting a block.
          if (
            op.type === 'split_node' &&
            op.path.length === 1 &&
            Element.isElementProps(op.properties) &&
            op.properties._type === portableTextFeatures.types.block.name &&
            'markDefs' in op.properties &&
            Array.isArray(op.properties.markDefs) &&
            op.properties.markDefs.length > 0 &&
            op.path[0] + 1 < editor.children.length
          ) {
            const [targetBlock, targetPath] = Editor.node(editor, [op.path[0] + 1])
            debug(`Copying markDefs over to split block`, op)
            if (editor.isTextBlock(targetBlock)) {
              const oldDefs = (Array.isArray(targetBlock.markDefs) && targetBlock.markDefs) || []
              Transforms.setNodes(
                editor,
                {markDefs: uniq([...oldDefs, ...op.properties.markDefs])},
                {at: targetPath, voids: false}
              )
              editor.onChange()
            }
          }
          // Make sure marks are reset, if a block is split at the end.
          if (
            op.type === 'split_node' &&
            op.path.length === 2 &&
            op.properties._type === portableTextFeatures.types.span.name &&
            'marks' in op.properties &&
            Array.isArray(op.properties.marks) &&
            op.properties.marks.length > 0 &&
            op.path[0] + 1 < editor.children.length
          ) {
            const [child, childPath] = Editor.node(editor, [op.path[0] + 1, 0])
            if (
              Text.isText(child) &&
              child.text === '' &&
              Array.isArray(child.marks) &&
              child.marks.length > 0
            ) {
              Transforms.setNodes(editor, {marks: []}, {at: childPath, voids: false})
              editor.onChange()
            }
          }
          // Make sure markDefs are reset, if a block is split at start.
          if (
            op.type === 'split_node' &&
            op.path.length === 1 &&
            op.properties._type === portableTextFeatures.types.block.name &&
            'markDefs' in op.properties &&
            Array.isArray(op.properties.markDefs) &&
            op.properties.markDefs.length > 0
          ) {
            const [block, blockPath] = Editor.node(editor, [op.path[0]])
            if (
              editor.isTextBlock(block) &&
              block.children.length === 1 &&
              block.markDefs.length > 0 &&
              Text.isText(block.children[0]) &&
              block.children[0].text === '' &&
              block.children[0].marks.length === 0
            ) {
              Transforms.setNodes(editor, {markDefs: []}, {at: blockPath})
              editor.onChange()
            }
          }
        }
        // Empty marks if text is empty
        if (isSpan && Array.isArray(node.marks) && node.marks.length > 0 && node.text === '') {
          Transforms.setNodes(editor, {marks: []}, {at: path, voids: false})
          editor.onChange()
        }
      }
      // Check consistency of markDefs
      if (
        isTextBlock &&
        editor.operations.some((op) =>
          ['split_node', 'remove_node', 'remove_text', 'merge_node'].includes(op.type)
        )
      ) {
        normalizeMarkDefs(editor)
      }
    }

    // Special hook before inserting text at the end of an annotation.
    editor.apply = (op) => {
      if (op.type === 'insert_text') {
        const {selection} = editor
        if (
          selection &&
          Range.isCollapsed(selection) &&
          Editor.marks(editor)?.marks?.some((mark) => !decorators.includes(mark))
        ) {
          const [node] = Array.from(
            Editor.nodes(editor, {
              mode: 'lowest',
              at: selection.focus,
              match: (n) => n._type === portableTextFeatures.types.span.name,
              voids: false,
            })
          )[0] || [undefined]
          if (
            Text.isText(node) &&
            node.text.length === selection.focus.offset &&
            Array.isArray(node.marks) &&
            node.marks.length > 0
          ) {
            apply(op)
            Transforms.splitNodes(editor, {
              match: Text.isText,
              at: {...selection.focus, offset: selection.focus.offset},
            })
            const marksWithoutAnnotationMarks: string[] = (
              {
                ...(Editor.marks(editor) || {}),
              }.marks || []
            ).filter((mark) => decorators.includes(mark))
            Transforms.setNodes(
              editor,
              {marks: marksWithoutAnnotationMarks},
              {at: Path.next(selection.focus.path)}
            )
            return
          }
        }
      }
      apply(op)
    }

    // Override built in addMark function
    editor.addMark = (mark: string) => {
      if (editor.selection) {
        if (Range.isExpanded(editor.selection)) {
          // Split if needed
          Transforms.setNodes(editor, {}, {match: Text.isText, split: true})
          // Use new selection
          const splitTextNodes = [
            ...Editor.nodes(editor, {at: editor.selection, match: Text.isText}),
          ]
          const shouldRemoveMark = flatten(
            splitTextNodes.map((item) => item[0]).map((node) => node.marks)
          ).includes(mark)
          if (shouldRemoveMark) {
            editor.removeMark(mark)
            return
          }
          Editor.withoutNormalizing(editor, () => {
            splitTextNodes.forEach(([node, path]) => {
              const marks = [
                ...(Array.isArray(node.marks) ? node.marks : []).filter(
                  (eMark: string) => eMark !== mark
                ),
                mark,
              ]
              Transforms.setNodes(
                editor,
                {marks},
                {at: path, match: Text.isText, split: true, hanging: true}
              )
            })
          })
          Editor.normalize(editor)
        } else {
          const existingMarks: string[] =
            {
              ...(Editor.marks(editor) || {}),
            }.marks || []
          const marks = {
            ...(Editor.marks(editor) || {}),
            marks: [...existingMarks, mark],
          }
          editor.marks = marks as Text
        }
        editor.onChange()
      }
    }

    // Override built in removeMark function
    editor.removeMark = (mark: string) => {
      const {selection} = editor
      if (selection) {
        if (Range.isExpanded(selection)) {
          Editor.withoutNormalizing(editor, () => {
            // Split if needed
            Transforms.setNodes(editor, {}, {match: Text.isText, split: true})
            if (editor.selection) {
              const splitTextNodes = [
                ...Editor.nodes(editor, {at: editor.selection, match: Text.isText}),
              ]
              splitTextNodes.forEach(([node, path]) => {
                const block = editor.children[path[0]]
                if (Element.isElement(block) && block.children.includes(node)) {
                  Transforms.setNodes(
                    editor,
                    {
                      marks: (Array.isArray(node.marks) ? node.marks : []).filter(
                        (eMark: string) => eMark !== mark
                      ),
                    },
                    {at: path}
                  )
                }
              })
            }
          })
          Editor.normalize(editor)
        } else {
          const existingMarks: string[] =
            {
              ...(Editor.marks(editor) || {}),
            }.marks || []
          const marks = {
            ...(Editor.marks(editor) || {}),
            marks: existingMarks.filter((eMark) => eMark !== mark),
          }
          editor.marks = marks as Text
        }
        editor.onChange()
      }
    }

    editor.pteIsMarkActive = (mark: string): boolean => {
      if (!editor.selection || editor.selection.focus.path.length < 2) {
        return false
      }
      let existingMarks =
        {
          ...(Editor.marks(editor) || {}),
        }.marks || []
      if (Range.isExpanded(editor.selection)) {
        Array.from(Editor.nodes(editor, {match: Text.isText, at: editor.selection})).forEach(
          (n) => {
            const [node] = n as NodeEntry<Text>
            existingMarks = uniq([...existingMarks, ...((node.marks as string[]) || [])])
          }
        )
      }
      return existingMarks.includes(mark)
    }

    // Custom editor function to toggle a mark
    editor.pteToggleMark = (mark: string) => {
      const isActive = editor.pteIsMarkActive(mark)
      if (isActive) {
        debug(`Remove mark '${mark}'`)
        Editor.removeMark(editor, mark)
      } else {
        debug(`Add mark '${mark}'`)
        Editor.addMark(editor, mark, true)
      }
      editor.onChange()
    }
    return editor
  }

  /**
   * Normalize re-marked spans in selection
   */
  function mergeSpans(editor: Editor) {
    const {selection} = editor
    if (selection) {
      for (const [node, path] of Array.from(
        Editor.nodes(editor, {
          at: Editor.range(editor, [selection.anchor.path[0]], [selection.focus.path[0]]),
        })
      ).reverse()) {
        const [parent] = path.length > 1 ? Editor.node(editor, Path.parent(path)) : [undefined]
        const nextPath = [path[0], path[1] + 1]
        if (Editor.isBlock(editor, parent)) {
          const nextNode = parent.children[nextPath[1]]
          if (Text.isText(node) && Text.isText(nextNode) && isEqual(nextNode.marks, node.marks)) {
            debug('Merging spans')
            Transforms.mergeNodes(editor, {at: nextPath, voids: true})
            editor.onChange()
          }
        }
      }
    }
  }
  /**
   * Normalize markDefs
   *
   */
  function normalizeMarkDefs(editor: Editor) {
    const {selection} = editor
    if (selection) {
      const blocks = Editor.nodes(editor, {
        at: selection,
        match: (n) => n._type === portableTextFeatures.types.block.name,
      })
      for (const [block, path] of blocks) {
        if (editor.isTextBlock(block)) {
          const newMarkDefs = block.markDefs.filter((def) => {
            return block.children.find((child) => {
              return (
                Text.isText(child) && Array.isArray(child.marks) && child.marks.includes(def._key)
              )
            })
          })
          if (!isEqual(newMarkDefs, block.markDefs)) {
            debug('Removing markDef not in use')
            Transforms.setNodes(
              editor,
              {
                markDefs: newMarkDefs,
              },
              {at: path}
            )
            editor.onChange()
          }
        }
      }
    }
  }
}
