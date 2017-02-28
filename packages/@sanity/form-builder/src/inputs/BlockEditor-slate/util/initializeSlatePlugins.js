import insertBlockOnEnter from 'slate-insert-block-on-enter'
import softBreak from 'slate-soft-break'
import formBuilderNodeOnDrop from '../plugins/formBuilderNodeOnDrop'
import formBuilderNodeOnPaste from '../plugins/formBuilderNodeOnPaste'
import onModKeySetMarkCombos from '../plugins/onModKeySetMarkCombos'
import onEnterInListItem from '../plugins/onEnterInListItem'
import textBlockOnEnterKey from '../plugins/textBlockOnEnterKey'
import editorOnPasteHtml from '../plugins/editorOnPasteHtml'

import {SLATE_DEFAULT_STYLE} from '../constants'

const insertBlockOnEnterDef = {
  type: 'contentBlock',
  kind: 'block',
  data: {
    style: SLATE_DEFAULT_STYLE
  },
  nodes: [{kind: 'text', text: '', ranges: []}]
}

export default function intializeSlatePlugins(blockEditor) {
  return [
    insertBlockOnEnter(insertBlockOnEnterDef),

    // Copy paste
    // TODO: wire up this when spanBlocks are ready
    editorOnPasteHtml(blockEditor),
    formBuilderNodeOnPaste(blockEditor.context.formBuilder, blockEditor.props.type.of),

    // Key handling
    onEnterInListItem(SLATE_DEFAULT_STYLE, blockEditor.refreshCSS),
    textBlockOnEnterKey(SLATE_DEFAULT_STYLE),

    // Set mark keyboard shortcuts
    onModKeySetMarkCombos(blockEditor),

    // Dropping stuff onto formBuilder nodes
    formBuilderNodeOnDrop(),


    softBreak({
      onlyIn: ['contentBlock'],
      shift: true
    })
  ]
}
