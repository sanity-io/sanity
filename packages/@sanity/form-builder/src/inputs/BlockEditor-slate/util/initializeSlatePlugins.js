import insertBlockOnEnter from 'slate-insert-block-on-enter'
import softBreak from 'slate-soft-break'
import onDrop from '../plugins/onDrop'
import onPasteSlateContent from '../plugins/onPasteSlateContent'
import onModKeySetMarkCombos from '../plugins/onModKeySetMarkCombos'
import onEnterInListItem from '../plugins/onEnterInListItem'
import onEnterInTextBlock from '../plugins/onEnterInTextBlock'
import onPasteHtml from '../plugins/onPasteHtml'
import onTabSetIntendation from '../plugins/onTabSetIntendation'

import {SLATE_DEFAULT_BLOCK} from '../constants'

export default function intializeSlatePlugins(blockEditor) {
  return [

    insertBlockOnEnter(SLATE_DEFAULT_BLOCK),
    softBreak({
      onlyIn: [SLATE_DEFAULT_BLOCK.type],
      shift: true
    }),

    onDrop(),

    onEnterInListItem(SLATE_DEFAULT_BLOCK, blockEditor.refreshCSS),

    onEnterInTextBlock(SLATE_DEFAULT_BLOCK),

    onModKeySetMarkCombos(blockEditor),

    onPasteHtml(blockEditor),

    onPasteSlateContent(blockEditor.context.formBuilder, blockEditor.props.type.of),

    onTabSetIntendation()

  ]
}
