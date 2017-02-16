import InsertBlockOnEnter from 'slate-insert-block-on-enter'
import SoftBreak from 'slate-soft-break'
import FormBuilderNodeOnDrop from '../plugins/FormBuilderNodeOnDrop'
import FormBuilderNodeOnPaste from '../plugins/FormBuilderNodeOnPaste'
import TextFormattingOnKeyDown from '../plugins/TextFormattingOnKeyDown'
import ListItemOnEnterKey from '../plugins/ListItemOnEnterKey'
import TextBlockOnEnterKey from '../plugins/TextBlockOnEnterKey'
import OnPasteHtml from '../plugins/OnPasteHtml'

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
    InsertBlockOnEnter(insertBlockOnEnterDef),

    // TODO: wire up this when spanBlocks are ready
    OnPasteHtml({link: blockEditor.linkType}, blockEditor.context),

    FormBuilderNodeOnDrop(),
    FormBuilderNodeOnPaste(blockEditor.context.formBuilder, blockEditor.props.type.of),
    TextFormattingOnKeyDown(),
    ListItemOnEnterKey(SLATE_DEFAULT_STYLE, blockEditor.refreshCSS),
    TextBlockOnEnterKey(SLATE_DEFAULT_STYLE),
    SoftBreak({
      onlyIn: ['contentBlock'],
      shift: true
    })
  ]
}
