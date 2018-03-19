import blockTools from '@sanity/block-tools'
import {Document} from 'slate'

function onPasteHtml(blockEditor) {
  function onPaste(event, data, change) {
    if (data.type != 'html') {
      return null
    }
    if (data.isShift) {
      return null
    }
    const blockContentType = blockEditor.props.type
    const blocks = blockTools.htmlToBlocks(data.html, {blockContentType})
    const {document} = blockTools.blocksToSlateState(blocks, blockContentType)
    return change.insertFragment(Document.fromJSON(document))
  }

  return {
    onPaste
  }
}

export default onPasteHtml
