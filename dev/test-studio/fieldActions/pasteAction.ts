import {ClipboardIcon} from '@sanity/icons'
import {useCallback} from 'react'
import {defineDocumentFieldAction, useCopyPasteAction} from 'sanity'

import {defineActionItem} from './define'

export const pasteAction = defineDocumentFieldAction({
  name: 'test/paste',
  useAction({documentId, documentType, path, schemaType}) {
    const {onPaste} = useCopyPasteAction({documentId, documentType, path, schemaType})
    const onAction = useCallback(() => {
      onPaste()
    }, [onPaste])

    return defineActionItem({
      type: 'action',
      icon: ClipboardIcon,
      onAction,
      title: 'Paste',
      hidden: path.length === 0,
    })
  },
})
