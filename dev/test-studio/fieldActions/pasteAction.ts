import {ClipboardIcon} from '@sanity/icons'
import {useCallback} from 'react'
import {defineDocumentFieldAction} from 'sanity'
import {defineActionItem} from './define'

export const pasteAction = defineDocumentFieldAction({
  name: 'test/paste',
  useAction({documentId, documentType, path}) {
    const onAction = useCallback(() => {
      // eslint-disable-next-line no-console
      console.log('paste', {documentId, documentType, path})
    }, [documentId, documentType, path])

    return defineActionItem({
      type: 'action',
      icon: ClipboardIcon,
      onAction,
      title: 'Paste',
    })
  },
})
