import {normalizeBlock} from '@sanity/block-tools'
import {useToast} from '@sanity/ui'
import {pickBy} from 'lodash'
import {useCallback, useMemo} from 'react'
import {PatchEvent, set, useGetFormValue, useProjectId, useSchema} from 'sanity'

import {useCopyPaste} from './CopyPasteProvider'
import {type CopyActionResult, type UseCopyPasteActionProps} from './types'
import {getLocalStorageItem, getLocalStorageKey, setLocalStorageItem} from './utils'

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
  const getter = useGetFormValue()
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
    const docValue = getter(path) // Assuming useGetFormValue hook exists
    const isDocument = schemaType?.type?.name === 'document'
    const isArray = schemaType?.type?.name === 'array'
    const isObject = schemaType?.type?.name === 'document'

    const payloadValue: CopyActionResult = {
      documentId,
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
    getter,
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

    const {schemaTypeName: sourceSchemaTypeName, isDocument, isArray} = value

    if (sourceSchemaTypeName !== schemaType.name) {
      toast.push({
        status: 'info',
        title: `Cannot paste ${sourceSchemaTypeName} into ${schemaType.name} field`,
      })
      return
    }

    const keysToDelete = ['_id', '_type', '_createdAt', '_updatedAt', '_rev']
    const isArrayValue = Array.isArray(value.docValue)
    const isPrimitiveValue = typeof value.docValue !== 'object'

    let targetValue =
      isArrayValue || isPrimitiveValue
        ? value.docValue
        : pickBy(
            value.docValue as object,
            (_value, key) => !keysToDelete.includes(key) && !key.startsWith('_'),
          )
    const isTargetDocument = schemaType?.type?.name === 'document'
    const targetName = schemaType.name
    const targetTypeLabel = isTargetDocument ? 'document' : 'field'

    if (isArrayValue || isArray) {
      // Reset/normalize array object keys
      targetValue = [...targetValue].map((item) => {
        return normalizeBlock(item)
      })
    }

    if (isDocument && (!isTargetDocument || documentType !== sourceSchemaTypeName)) {
      toast.push({
        status: 'error',
        title: `Cannot paste document of type ${sourceSchemaTypeName} into ${targetTypeLabel} of type ${targetName}`,
      })

      return
    }

    onChange(PatchEvent.from(set(targetValue, path)))

    toast.push({
      status: 'success',
      title: `${value.isDocument ? 'Document' : 'Field'} updated`,
    })
  }, [toast, onChange, projectId, documentType, path, schemaType.name, schemaType?.type?.name])

  return {onCopy, onPaste, isValidTargetType}
}
