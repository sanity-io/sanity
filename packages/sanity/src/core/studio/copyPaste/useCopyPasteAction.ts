import {useToast} from '@sanity/ui'
import {useCallback, useMemo} from 'react'
import {getPublishedId, PatchEvent, set, useGetFormValue, useProjectId, useSchema} from 'sanity'

import {useCopyPaste} from './CopyPasteProvider'
import {type CopyActionResult, type UseCopyPasteActionProps} from './types'
import {getLocalStorageItem, getLocalStorageKey, setLocalStorageItem} from './utils'
import {transferValue} from './valueTransfer'

/**
 * @internal
 * @hidden
 */
export const useCopyPasteAction = ({
  documentId,
  documentType,
  path,
  schemaType: maybeSchemaType,
}: UseCopyPasteActionProps) => {
  const projectId = useProjectId()
  const {
    setCopyResult,
    sendMessage,
    onChange,
    isValidTargetType: _isValidTargetType,
  } = useCopyPaste()
  const toast = useToast()
  const getFormValue = useGetFormValue()
  const schema = useSchema()
  const schemaType = useMemo(() => {
    if (typeof maybeSchemaType === 'string') {
      return schema.get(maybeSchemaType)!
    }

    return maybeSchemaType
  }, [schema, maybeSchemaType])

  const isValidTargetType = useMemo(() => {
    return _isValidTargetType(schemaType.name)
  }, [_isValidTargetType, schemaType])

  const onCopy = useCallback(() => {
    const docValue = getFormValue(path)
    const isDocument = schemaType?.type?.name === 'document'
    const isArray = schemaType?.type?.name === 'array'
    const isObject = schemaType?.type?.name === 'document'

    const payloadValue: CopyActionResult = {
      documentId: documentId ? getPublishedId(documentId) : undefined,
      documentType,
      schemaTypeName: schemaType.name,
      path,
      docValue,
      isDocument,
      isArray,
      isObject,
    }

    setCopyResult(payloadValue)
    sendMessage(payloadValue)
    setLocalStorageItem(getLocalStorageKey(projectId), payloadValue)

    toast.push({
      status: 'success',
      title: `${isDocument ? 'Document' : 'Field'} ${schemaType.name} copied`,
    })
  }, [
    documentId,
    documentType,
    path,
    schemaType,
    setCopyResult,
    sendMessage,
    toast,
    getFormValue,
    projectId,
  ])

  const onPaste = useCallback(() => {
    const value = getLocalStorageItem(getLocalStorageKey(projectId))
    if (!value) {
      toast.push({
        status: 'info',
        title: 'Nothing to paste',
      })
      return
    }

    let targetValue = null
    if (value) {
      try {
        targetValue = transferValue(value, {
          targetSchemaType: schemaType,
          targetDocumentType: documentType,
        })
        onChange(PatchEvent.from(set(targetValue, path)))
        toast.push({
          status: 'success',
          title: `${value.isDocument ? 'Document' : 'Field'} updated`,
        })
      } catch (error) {
        toast.push({
          status: 'error',
          title: error.message,
        })
      }
    }
  }, [projectId, toast, schemaType, documentType, onChange, path])

  return {onCopy, onPaste, isValidTargetType}
}
