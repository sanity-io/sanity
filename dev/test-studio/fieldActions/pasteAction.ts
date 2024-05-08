import {ClipboardIcon} from '@sanity/icons'
import {useCallback} from 'react'
import {PatchEvent, defineDocumentFieldAction, set, useFormCallbacks, useGetFormValue} from 'sanity'

import {defineActionItem} from './define'
import {useDocumentPane} from 'sanity/structure'
import {useToast} from '@sanity/ui'
import {CopyActionResult} from './copyAction'
import {filter, pickBy} from 'lodash'

export const pasteAction = defineDocumentFieldAction({
  name: 'test/paste',
  useAction({documentId, documentType, path, schemaType}) {
    const toast = useToast()
    const getter = useGetFormValue()
    // const {onChange} = useFormCallbacks()
    const {onChange} = useDocumentPane()
    const onAction = useCallback(() => {
      // const value = navigator.clipboard.read()
      const value = localStorage.getItem('copyActionResult')
      if (!value) {
        return
      }
      const parsed = JSON.parse(value) as CopyActionResult
      const {schemaTypeName, isDocument, isArray, isObject, path} = parsed

      const keysToDelete = ['_id', '_type', '_createdAt', '_updatedAt', '_rev']
      const isArrayValue = Array.isArray(parsed.docValue)
      const newValue = isArrayValue
        ? parsed.docValue
        : pickBy(parsed.docValue as {}, (_value, key) => !keysToDelete.includes(key))
      const isTargetDocument = schemaType?.type?.name === 'document'
      const targetName = schemaType.name
      const targetTypeLabel = isTargetDocument ? 'document' : 'field'

      if (isDocument && (!isTargetDocument || documentType !== schemaTypeName)) {
        toast.push({
          status: 'error',
          title: `Cannot paste document of type ${schemaTypeName} into ${targetTypeLabel} of type ${targetName}`,
        })

        return
      }

      onChange(PatchEvent.from(set(newValue, path)))

      toast.push({
        status: 'success',
        title: `${isDocument ? `Document` : `Field`} updated`,
      })
      // eslint-disable-next-line no-console
      console.log('paste', {documentId, documentType, path, parsed})
    }, [documentId, documentType, path])

    return defineActionItem({
      type: 'action',
      icon: ClipboardIcon,
      onAction,
      title: 'Paste',
    })
  },
})
