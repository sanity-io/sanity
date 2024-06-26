import {ClipboardIcon} from '@sanity/icons'
import {useCallback} from 'react'

import {defineDocumentFieldAction} from '../../../config/document/fieldActions/define'
import {useCopyPasteAction} from '../../../studio/copyPaste/useCopyPasteAction'
import {defineActionItem} from './define'

export const pasteAction = defineDocumentFieldAction({
  name: 'pasteField',
  useAction({path}) {
    const isDocument = path.length === 0
    const {onPaste} = useCopyPasteAction()
    const onAction = useCallback(() => {
      onPaste(path, {
        context: {source: isDocument ? 'documentFieldAction' : 'fieldAction'},
      })
    }, [onPaste, path, isDocument])

    return defineActionItem({
      type: 'action',
      icon: ClipboardIcon,
      onAction,
      title: isDocument ? 'Paste document' : 'Paste field',
    })
  },
})
