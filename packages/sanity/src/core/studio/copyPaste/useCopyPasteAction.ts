import {type Path} from '@sanity/types'
import {useToast} from '@sanity/ui'
import {flatten} from 'lodash'
import {useCallback} from 'react'
import {
  type FormDocumentValue,
  type FormPatch,
  getValueAtPath,
  PatchEvent,
  set,
  useSchema,
} from 'sanity'

import {useCopyPaste} from './CopyPasteProvider'
import {resolveSchemaTypeForPath} from './resolveSchemaTypeForPath'
import {type CopyActionResult} from './types'
import {getClipboardItem, isEmptyValue, writeClipboardItem} from './utils'
import {transferValue} from './valueTransfer'

/**
 * @internal
 * @hidden
 */
export function useCopyPasteAction() {
  const {getDocumentMeta, setCopyResult} = useCopyPaste()
  const toast = useToast()
  const {onChange} = getDocumentMeta()! || {}
  const schema = useSchema()

  const onCopy = useCallback(
    async (path: Path, value: FormDocumentValue | undefined) => {
      const documentMeta = getDocumentMeta()

      // Test that we got document meta first
      if (!documentMeta) {
        console.warn(`Failed to resolve document meta data for path ${path.join('.')}.`)
        toast.push({
          status: 'error',
          title: `Can't lookup the document meta data due to unknown error`,
        })
        return
      }
      const {documentId, documentType, schemaType} = documentMeta
      if (!schemaType) {
        console.warn(`Failed to resolve schema type for path ${path.join('.')}.`, {
          schemaType,
        })
        toast.push({
          status: 'error',
          title: `Can't lookup the field due to unknown error`,
        })
        return
      }

      const schemaTypeAtPath = resolveSchemaTypeForPath(schemaType, path)

      if (!schemaTypeAtPath) {
        toast.push({
          status: 'error',
          title: `Could not resolve schema type for path ${path.join('.')}`,
        })
        return
      }

      const isDocument = schemaTypeAtPath.type?.name === 'document'
      const isArray = schemaTypeAtPath.jsonType === 'array'
      const isObject = schemaTypeAtPath.jsonType === 'object'
      const valueAtPath = getValueAtPath(value, path)

      // Test if the value is empty (undefined, empty object or empty array)

      if (isEmptyValue(valueAtPath)) {
        toast.push({
          status: 'warning',
          title: 'Empty value, nothing to copy',
        })
        return
      }

      const payloadValue: CopyActionResult = {
        _type: 'copyResult',
        documentId,
        documentType,
        isDocument,
        isArray,
        isObject,
        items: [
          {
            schemaTypeName: schemaTypeAtPath?.name || 'unknown',
            schemaTypeTitle: schemaTypeAtPath?.title || schemaType?.name || 'unknown',
            documentPath: path,
            value: valueAtPath,
          },
        ],
      }

      setCopyResult(payloadValue)
      await writeClipboardItem(payloadValue)

      toast.push({
        status: 'success',
        title: `${isDocument ? 'Document' : 'Field'} ${payloadValue.items.map((item) => item.schemaTypeName).join(', ')} copied`,
      })
    },
    [getDocumentMeta, setCopyResult, toast],
  )

  const onPaste = useCallback(
    async (targetPath: Path) => {
      const {schemaType: targetDocumentSchemaType} = getDocumentMeta()!
      const targetSchemaType = resolveSchemaTypeForPath(targetDocumentSchemaType!, targetPath)!

      const clipboardItem = await getClipboardItem()

      // Return early if no clipboard item or if clipboard item is invalid
      if (!clipboardItem) {
        toast.push({
          status: 'info',
          title: 'Nothing to paste',
        })
        return
      }

      if (!clipboardItem.documentType) {
        toast.push({
          status: 'error',
          title: 'Invalid clipboard item',
        })
        return
      }

      const sourceDocumentSchemaType = schema.get(clipboardItem.documentType)

      if (!sourceDocumentSchemaType) {
        toast.push({
          status: 'error',
          title: 'Invalid clipboard item',
        })
        return
      }

      const updateItems: {patches: FormPatch[]; targetSchemaTypeTitle: string}[] = []

      for (const item of clipboardItem.items) {
        const sourceSchemaType = resolveSchemaTypeForPath(
          sourceDocumentSchemaType,
          item.documentPath,
        )
        if (!sourceSchemaType) {
          toast.push({
            status: 'error',
            title: `Failed to resolve schema type for path ${item.documentPath.join('.')}`,
          })
          return
        }
        if (!targetDocumentSchemaType) {
          toast.push({
            status: 'error',
            title: `Failed to resolve schema type for path ${targetPath.join('.')}`,
          })
          return
        }
        const targetSchemaTypeTitle = targetSchemaType?.title || targetSchemaType?.name
        const transferValueOptions = {
          sourceRootSchemaType: sourceSchemaType,
          sourcePath: [],
          sourceValue: item.value,
          targetRootSchemaType: targetSchemaType,
          targetPath: [],
        }
        try {
          const {targetValue, errors} = transferValue(transferValueOptions)
          if (isEmptyValue(targetValue)) {
            toast.push({
              status: 'warning',
              title: 'Nothing from the clipboard could be pasted here',
            })
            return
          }
          const nonWarningErrors = errors.filter((error) => error.level !== 'warning')
          if (nonWarningErrors.length > 0) {
            toast.push({
              status: 'error',
              title: 'Could not paste',
              description: nonWarningErrors[0].message,
            })
            return
          } else if (errors.length > 0) {
            toast.push({
              status: 'warning',
              title: 'Could not paste all values',
              description: errors.map((error) => error.message).join(', '),
            })
          }
          updateItems.push({patches: [set(targetValue, targetPath)], targetSchemaTypeTitle})
        } catch (error) {
          toast.push({
            status: 'error',
            title: error.message,
          })
          return
        }
      }

      if (updateItems.length) {
        const allPatches = flatten(updateItems.map(({patches}) => patches))
        const allTargetNames = updateItems
          .map(({targetSchemaTypeTitle}) => targetSchemaTypeTitle)
          .join(', ')
        onChange?.(PatchEvent.from(allPatches))
        toast.push({
          status: 'success',
          title: `${clipboardItem.isDocument ? 'Document' : 'Field'} ${allTargetNames} updated`,
        })
      }
    },
    [getDocumentMeta, schema, toast, onChange],
  )

  return {onCopy, onPaste, onChange}
}
