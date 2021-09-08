import {Subject} from 'rxjs'
import {Editor, Transforms, Element, Path} from 'slate'
import {PortableTextFeatures} from '../../types/portableText'
import {EditorChange, PortableTextSlateEditor} from '../../types/editor'
import {debugWithName} from '../../utils/debug'
import {toPortableTextRange} from '../../utils/ranges'

const debug = debugWithName('plugin:withPortableTextBlockStyle')

export function createWithPortableTextBlockStyle(
  portableTextFeatures: PortableTextFeatures,
  change$: Subject<EditorChange>
) {
  return function withPortableTextBlockStyle(editor: PortableTextSlateEditor) {
    const normalStyle = portableTextFeatures.styles[0].value
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
          op.properties.style !== normalStyle &&
          op.path[0] === path[0] &&
          !Path.equals(path, op.path)
        ) {
          const [child] = Editor.node(editor, [op.path[0] + 1, 0])
          if (child.text === '') {
            debug(`Normalizing split node to ${normalStyle} style`, op)
            Transforms.setNodes(editor, {style: normalStyle}, {at: [op.path[0] + 1], voids: false})
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
          match: (node) => Element.isElement(node) && node.style === style,
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
          match: (node) =>
            Element.isElement(node) && node._type === portableTextFeatures.types.block.name,
        }),
      ]
      selectedBlocks.forEach(([node, path]) => {
        const {style, ...rest} = node
        if (node.style === blockStyle) {
          debug(`Unsetting block style '${blockStyle}'`)
          Transforms.setNodes(editor, {...rest, style: undefined}, {at: path})
        } else {
          const defaultStyle =
            portableTextFeatures.styles[0] && portableTextFeatures.styles[0].value
          if (blockStyle) {
            debug(`Setting style '${blockStyle}'`)
          } else {
            debug('Setting default style', defaultStyle)
          }
          Transforms.setNodes(
            editor,
            {
              ...rest,
              style: blockStyle || defaultStyle,
            },
            {at: path}
          )
        }
      })
      // Emit a new selection here (though it might be the same).
      // Toolbars and similar on the outside may rely on selection changes to update themselves.
      change$.next({type: 'selection', selection: toPortableTextRange(editor)})
      editor.onChange()
    }
    return editor
  }
}
