import {CopyIcon} from '@sanity/icons'
import {useCallback} from 'react'
import {
  Path,
  SanityDocument,
  defineDocumentFieldAction,
  useDocumentStore,
  useFormValue,
  useGetFormValue,
} from 'sanity'

import {defineActionItem} from './define'
import {useToast} from '@sanity/ui'

export interface CopyActionResult {
  documentId: string
  documentType: string
  schemaTypeName: string
  docValue: unknown
  isDocument: boolean
  isArray: boolean
  isObject: boolean
  path: Path
}

export const copyAction = defineDocumentFieldAction({
  name: 'test/copy',
  useAction({documentId, documentType, path, schemaType}) {
    const {jsonType, name: schemaTypeName} = schemaType
    // const docValue = useFormValue(path) as SanityDocument
    const getter = useGetFormValue()
    const toast = useToast()
    const onAction = useCallback(() => {
      // const documentStore = useDocumentStore()
      const docValue = getter(path)
      const isDocument = schemaType?.type?.name === 'document'
      const isArray = schemaType?.type?.name === 'array'
      const isObject = schemaType?.type?.name === 'document'
      // const name: string = schemaType?.type?.name || schemaType?.name
      const payloadValue: CopyActionResult = {
        schemaTypeName,
        documentId,
        documentType,
        path,
        docValue,
        isDocument,
        isArray,
        isObject,
      }

      const label = isDocument ? `Document` : `Field`

      // navigator.clipboard.writeText(value)
      localStorage.setItem('copyActionResult', JSON.stringify(payloadValue))

      toast.push({
        status: 'success',
        title: `${label} copied`,
      })

      // eslint-disable-next-line no-console
      console.log('comment', {payloadValue, jsonType})
    }, [documentId, documentType, path, toast])

    return defineActionItem({
      type: 'action',
      icon: CopyIcon,
      onAction,
      title: 'Copy',
    })
  },
})
