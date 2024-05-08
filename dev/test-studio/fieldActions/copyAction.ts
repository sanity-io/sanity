import {CopyIcon} from '@sanity/icons'
import {useCallback} from 'react'
import {
  SanityDocument,
  defineDocumentFieldAction,
  useDocumentStore,
  useFormValue,
  useGetFormValue,
} from 'sanity'

import {defineActionItem} from './define'
import {useToast} from '@sanity/ui'

export const copyAction = defineDocumentFieldAction({
  name: 'test/copy',
  useAction({documentId, documentType, path}) {
    // const docValue = useFormValue(path) as SanityDocument
    const getter = useGetFormValue()
    const toast = useToast()
    const onAction = useCallback(() => {
      // const documentStore = useDocumentStore()
      const docValue = getter(path)
      // const docValue: string[] = []
      const value = JSON.stringify({documentId, documentType, path, docValue})
      // const pair = documentStore
      // .checkoutPair({draftId: documentId, publishedId: documentId}).published.

      // navigator.clipboard.writeText(value)
      localStorage.setItem('copiedField', value)

      toast.push({
        status: 'success',
        title: 'Field copied',
      })

      // eslint-disable-next-line no-console
      console.log('comment', {documentId, documentType, path, docValue})
    }, [documentId, documentType, path, toast])

    return defineActionItem({
      type: 'action',
      icon: CopyIcon,
      onAction,
      title: 'Copy',
    })
  },
})
