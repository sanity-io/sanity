import {ClipboardIcon} from '@sanity/icons'
import {useCallback} from 'react'

import {defineDocumentFieldAction} from '../../../config/document/fieldActions/define'
import {useCopyPasteAction} from '../../../studio/copyPaste/useCopyPasteAction'
import {defineActionItem} from './define'

export const pasteAction = defineDocumentFieldAction({
  name: 'test/paste',
  useAction({path}) {
    const {onPaste} = useCopyPasteAction()
    const onAction = useCallback(() => {
      onPaste(path, {
        context: {source: 'fieldAction'},
      })
    }, [path, onPaste])

    return defineActionItem({
      type: 'action',
      icon: ClipboardIcon,
      onAction,
      title: 'Paste field',
      hidden: path.length === 0,
    })
  },
})
