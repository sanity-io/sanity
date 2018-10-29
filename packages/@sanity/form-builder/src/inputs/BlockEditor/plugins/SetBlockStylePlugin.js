// @flow
import type {SlateEditor} from '../typeDefs'

// This plugin sets the style on a block

export default function SetBlockStylePlugin() {
  return {
    // eslint-disable-next-line complexity
    onCommand(command: any, editor: SlateEditor, next: void => void) {
      if (command.type !== 'setBlockStyle') {
        return next()
      }
      const {selection, startBlock, endBlock} = editor.value
      const styleName = command.args[0]
      // If a single block is selected partially, split block conditionally
      // (selection in start, middle or end of text)
      if (
        startBlock === endBlock &&
        selection.isExpanded &&
        !(selection.start.isAtStartOfNode(startBlock) && selection.end.isAtEndOfNode(startBlock))
      ) {
        const hasTextBefore = !selection.start.isAtStartOfNode(startBlock)
        const hasTextAfter = !selection.end.isAtEndOfNode(startBlock)
        const move = selection.isForward
          ? selection.focus.offset - selection.anchor.offset
          : selection.anchor.offset - selection.focus.offset

        if (hasTextAfter && !hasTextBefore) {
          editor
            .moveToStart()
            .moveForward(move)
            .moveToEnd()
            .splitBlock()
            .moveToStartOfPreviousText()
        } else if (hasTextBefore && !hasTextAfter) {
          editor
            .moveToEnd()
            .moveBackward(move)
            .moveToEnd()
            .splitBlock()
            .moveToEnd()
        } else {
          editor[selection.isForward ? 'moveToAnchor' : 'moveToFocus']()
            .splitBlock()
            .moveForward(move)
            .splitBlock()
            .moveToStartOfPreviousBlock()
        }
      }
      // Do the actual style transform, only acting on type contentBlock
      editor.value.blocks.forEach(blk => {
        const newData = {...blk.data.toObject(), style: styleName}
        if (blk.type === 'contentBlock') {
          editor.setNodeByKey(blk.key, {data: newData})
        }
      })
      editor.focus()
      return editor
    }
  }
}
