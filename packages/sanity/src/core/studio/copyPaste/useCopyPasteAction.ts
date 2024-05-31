import {useToast} from '@sanity/ui'
import {useCallback, useMemo} from 'react'
import {getPublishedId, PatchEvent, set, useGetFormValue, useSchema} from 'sanity'

import {useCopyPaste} from './CopyPasteProvider'
import {type CopyActionResult, type UseCopyPasteActionProps} from './types'
import {getClipboardItem, isCopyPasteResult, parseCopyResult, writeClipboardItem} from './utils'
import {transferValue} from './valueTransfer'

/**
 * @internal
 * @hidden
 */
export const useCopyPasteAction = ({
  path,
  schemaType: maybeSchemaType,
}: UseCopyPasteActionProps) => {
  const {
    documentId,
    documentType,
    setCopyResult,
    sendMessage,
    onChange,
    refreshCopyResult,
    isValidTargetType: _isValidTargetType,
    isCopyResultInClipboard,
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

  const onCopy = useCallback(async () => {
    const existingValue = getFormValue(path)
    const isDocument = schemaType?.type?.name === 'document'
    const isArray = schemaType?.type?.name === 'array'
    const isObject = schemaType?.type?.name === 'document'
    const parsedDocValue = parseCopyResult(existingValue)
    const normalizedValue = isCopyPasteResult(parsedDocValue)
      ? parsedDocValue.docValue
      : existingValue

    const payloadValue: CopyActionResult = {
      _type: 'copyResult',
      documentId: documentId ? getPublishedId(documentId) : undefined,
      documentType,
      schemaTypeName: schemaType.name,
      schemaTypeTitle: schemaType?.title || schemaType?.name,
      path,
      docValue: normalizedValue,
      isDocument,
      isArray,
      isObject,
    }

    setCopyResult(payloadValue)
    sendMessage(payloadValue)
    await writeClipboardItem(payloadValue)

    toast.push({
      status: 'success',
      title: `${isDocument ? 'Document' : 'Field'} ${payloadValue.schemaTypeTitle} copied`,
    })
  }, [documentId, documentType, path, schemaType, setCopyResult, sendMessage, toast, getFormValue])

  const onPaste = useCallback(async () => {
    const value = await getClipboardItem()
    if (!value) {
      toast.push({
        status: 'info',
        title: 'Nothing to paste',
      })
      return
    }

    const targetSchemaTypeTitle = schemaType?.title || schemaType?.name
    let targetValue = null

    if (value) {
      try {
        targetValue = transferValue(value, {
          targetSchemaType: schemaType,
          targetDocumentType: documentType,
        })
        onChange?.(PatchEvent.from(set(targetValue, path)))
        toast.push({
          status: 'success',
          title: `${value.isDocument ? 'Document' : 'Field'} ${targetSchemaTypeTitle} updated`,
        })
      } catch (error) {
        toast.push({
          status: 'error',
          title: error.message,
        })
      }
    }
  }, [toast, schemaType, documentType, onChange, path])

  return {onCopy, onPaste, refreshCopyResult, isValidTargetType, isCopyResultInClipboard}
}
