import {type Path} from '@sanity/types'
import {useToast} from '@sanity/ui'
import {useCallback} from 'react'
import {type FormDocumentValue, getValueAtPath, PatchEvent, set} from 'sanity'

import {useCopyPaste} from './CopyPasteProvider'
import {resolveSchemaTypeForPath} from './resolveSchemaTypeForPath'
import {type CopyActionResult} from './types'
import {getClipboardItem, isCopyPasteResult, parseCopyResult, writeClipboardItem} from './utils'
import {transferValue} from './valueTransfer'

/**
 * @internal
 * @hidden
 */
export function useCopyPasteAction() {
  const {getDocumentMeta, setCopyResult, isValidTargetType: _isValidTargetType} = useCopyPaste()
  const toast = useToast()
  const {onChange} = getDocumentMeta()! || {}

  const onCopy = useCallback(
    async (path: Path, value: FormDocumentValue | undefined) => {
      const {documentId, documentType, schemaType: sourceSchemaType} = getDocumentMeta()!
      const schemaType = resolveSchemaTypeForPath(sourceSchemaType!, path)
      const existingValue = getValueAtPath(value, path)
      const isDocument = schemaType?.type?.name === 'document'
      const isArray = schemaType?.type?.name === 'array'
      const isObject = schemaType?.type?.name === 'document'
      const parsedDocValue = parseCopyResult(existingValue)
      const normalizedValue = isCopyPasteResult(parsedDocValue)
        ? parsedDocValue.docValue
        : existingValue

      if (!schemaType) {
        console.warn(`Failed to resolve schema type for path ${path.join('.')}.`, {
          sourceSchemaType,
        })
        toast.push({
          status: 'error',
          title: `Can't lookup the field due to unknown error`,
        })
        return
      }

      const payloadValue: CopyActionResult = {
        _type: 'copyResult',
        documentId,
        documentType,
        schemaTypeName: schemaType?.name || 'unknown',
        schemaTypeTitle: schemaType?.title || schemaType?.name || 'unknown',
        path,
        docValue: normalizedValue,
        isDocument,
        isArray,
        isObject,
      }

      setCopyResult(payloadValue)
      await writeClipboardItem(payloadValue)

      toast.push({
        status: 'success',
        title: `${isDocument ? 'Document' : 'Field'} ${payloadValue.schemaTypeTitle} copied`,
      })
    },
    [getDocumentMeta, setCopyResult, toast],
  )

  const onPaste = useCallback(
    async (path: Path) => {
      const {documentType, schemaType: sourceSchemaType} = getDocumentMeta()!
      const schemaType = resolveSchemaTypeForPath(sourceSchemaType!, path)!
      const value = await getClipboardItem()

      if (!value) {
        toast.push({
          status: 'info',
          title: 'Nothing to paste',
        })
        return
      }

      if (!schemaType) {
        toast.push({
          status: 'error',
          title: `Failed to resolve schema type for path ${path.join('.')}`,
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
    },
    [toast, getDocumentMeta, onChange],
  )

  return {onCopy, onPaste, onChange}
}
