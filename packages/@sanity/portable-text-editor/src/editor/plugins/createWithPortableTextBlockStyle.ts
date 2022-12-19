import {Subject} from 'rxjs'
import {Editor, Transforms, Element, Path, Text as SlateText, Node} from 'slate'
import {
  EditorChange,
  PortableTextMemberSchemaTypes,
  PortableTextSlateEditor,
} from '../../types/editor'
import {debugWithName} from '../../utils/debug'
import {toPortableTextRange} from '../../utils/ranges'
import {fromSlateValue} from '../../utils/values'

const debug = debugWithName('plugin:withPortableTextBlockStyle')

export function createWithPortableTextBlockStyle(
  types: PortableTextMemberSchemaTypes,
  change$: Subject<EditorChange>
): (editor: PortableTextSlateEditor) => PortableTextSlateEditor {
  const defaultStyle = types.styles[0].value
  return function withPortableTextBlockStyle(
    editor: PortableTextSlateEditor
  ): PortableTextSlateEditor {
    // Extend Slate's default normalization to reset split node to normal style
    // if there is no text at the right end of the split.
    const {normalizeNode} = editor
    editor.normalizeNode = (nodeEntry) => {
      normalizeNode(nodeEntry)
      const [, path] = nodeEntry
      for (const op of editor.operations) {
        if (
          op.type === 'split_node' &&
          op.path.length === 1 &&
          editor.isTextBlock(op.properties) &&
          op.properties.style !== defaultStyle &&
          op.path[0] === path[0] &&
          !Path.equals(path, op.path)
        ) {
          const [child] = Editor.node(editor, [op.path[0] + 1, 0])
          if (SlateText.isText(child) && child.text === '') {
            debug(`Normalizing split node to ${defaultStyle} style`, op)
            Transforms.setNodes(editor, {style: defaultStyle}, {at: [op.path[0] + 1], voids: false})
            break
          }
        }
      }
    }
    editor.pteHasBlockStyle = (style: string): boolean => {
      if (!editor.selection) {
        return false
      }
      const selectedBlocks = [
        ...Editor.nodes(editor, {
          at: editor.selection,
          match: (node) => editor.isTextBlock(node) && node.style === style,
        }),
      ]
      if (selectedBlocks.length > 0) {
        return true
      }
      return false
    }

    editor.pteToggleBlockStyle = (blockStyle: string): void => {
      if (!editor.selection) {
        return
      }
      const selectedBlocks = [
        ...Editor.nodes(editor, {
          at: editor.selection,
          match: (node) => Element.isElement(node) && node._type === types.block.name,
        }),
      ]
      selectedBlocks.forEach(([node, path]) => {
        if (editor.isTextBlock(node) && node.style === blockStyle) {
          debug(`Unsetting block style '${blockStyle}'`)
          Transforms.setNodes(editor, {...node, style: defaultStyle} as Partial<Node>, {
            at: path,
          })
        } else {
          if (blockStyle) {
            debug(`Setting style '${blockStyle}'`)
          } else {
            debug('Setting default style', defaultStyle)
          }
          Transforms.setNodes(
            editor,
            {
              ...node,
              style: blockStyle || defaultStyle,
            } as Partial<Node>,
            {at: path}
          )
        }
      })
      // Emit a new selection here (though it might be the same).
      // Toolbars and similar on the outside may rely on selection changes to update themselves.
      change$.next({
        type: 'selection',
        selection: toPortableTextRange(
          fromSlateValue(editor.children, types.block.name),
          editor.selection,
          types
        ),
      })
      editor.onChange()
    }
    return editor
  }
}
