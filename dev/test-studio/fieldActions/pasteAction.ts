import {ClipboardIcon} from '@sanity/icons'
import {useCallback} from 'react'
import {PatchEvent, defineDocumentFieldAction, set, useFormCallbacks} from 'sanity'

import {defineActionItem} from './define'
import {useDocumentPane} from 'sanity/structure'
import {useToast} from '@sanity/ui'

interface RawDocument {
  documentId: string
  documentType: string
  path: string
  docValue: string
}

export const pasteAction = defineDocumentFieldAction({
  name: 'test/paste',
  useAction({documentId, documentType, path}) {
    const toast = useToast()
    // const {onChange} = useFormCallbacks()
    const {onChange} = useDocumentPane()
    const onAction = useCallback(() => {
      // const value = navigator.clipboard.read()
      const value = localStorage.getItem('copiedField')
      if (!value) {
        return
      }
      const parsed = JSON.parse(value) as RawDocument
      const newValue = parsed.docValue
      onChange(PatchEvent.from(set(newValue, path)))

      toast.push({
        status: 'success',
        title: 'Field updated',
      })
      // eslint-disable-next-line no-console
      console.log('paste', {documentId, documentType, path, existingValue: parsed.docValue})
    }, [documentId, documentType, path])

    return defineActionItem({
      type: 'action',
      icon: ClipboardIcon,
      onAction,
      title: 'Paste',
    })
  },
})
