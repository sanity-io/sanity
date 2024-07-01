/* eslint-disable max-statements */
import {useTelemetry} from '@sanity/telemetry/react'
import {type Path} from '@sanity/types'
import {useToast} from '@sanity/ui'
import * as PathUtils from '@sanity/util/paths'
import {flatten} from 'lodash'
import {useCallback} from 'react'
import {
  type FormDocumentValue,
  type FormPatch,
  getValueAtPath,
  PatchEvent,
  set,
  useClient,
  useSchema,
} from 'sanity'

import {useTranslation} from '../../i18n'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../studioClient'
import {FieldCopied, FieldPasted} from './__telemetry__/copyPaste.telemetry'
import {useCopyPaste} from './CopyPasteProvider'
import {resolveSchemaTypeForPath} from './resolveSchemaTypeForPath'
import {transferValue, type TransferValueOptions} from './transferValue'
import {type CopyActionResult, type CopyOptions, type PasteOptions} from './types'
import {getClipboardItem, isEmptyValue, writeClipboardItem} from './utils'

interface CopyPasteHookValue {
  onCopy: (path: Path, value: FormDocumentValue | undefined, options?: CopyOptions) => Promise<void>
  onPaste: (
    targetPath: Path,
    value: FormDocumentValue | undefined,
    options?: PasteOptions,
  ) => Promise<void>
  onChange: ((event: PatchEvent) => void) | undefined
}

/**
 * @internal
 * @hidden
 */
export function useCopyPasteAction(): CopyPasteHookValue {
  const telemetry = useTelemetry()
  const schema = useSchema()
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const toast = useToast()
  const {t} = useTranslation('copy-paste')

  const {getDocumentMeta, setCopyResult} = useCopyPaste()
  const {onChange} = getDocumentMeta()! || {}

  const onCopy = useCallback(
    async (path: Path, value: FormDocumentValue | undefined, options?: CopyOptions) => {
      const documentMeta = getDocumentMeta()

      // Test that we got document meta first
      if (!documentMeta) {
        console.warn(`Failed to resolve document meta data for path ${PathUtils.toString(path)}.`)

        toast.push({
          status: 'error',
          title: t('copy-paste.on-copy.validation.document-metadata-unknown-error.title'),
        })
        return
      }

      const {documentId, documentType, schemaType} = documentMeta

      if (!schemaType) {
        console.warn(`Failed to resolve schema type for path ${PathUtils.toString(path)}.`, {
          schemaType,
        })
        toast.push({
          status: 'error',
          title: t('copy-paste.on-copy.validation.unknown-error.title'),
        })
        return
      }

      const schemaTypeAtPath = resolveSchemaTypeForPath(schemaType, path, value)

      if (!schemaTypeAtPath) {
        toast.push({
          status: 'error',
          title: t('copy-paste.on-copy.validation.schema-type-incompatible.title', {
            path: PathUtils.toString(path),
          }),
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
          title: t('copy-paste.on-copy.validation.no-value.title'),
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
            schemaTypeName: schemaTypeAtPath.name || 'unknown',
            schemaTypeTitle: schemaTypeAtPath.title || schemaType.name || 'unknown',
            documentPath: path,
            value: valueAtPath,
          },
        ],
      }

      telemetry.log(FieldCopied, {
        context: options?.context?.source || 'unknown',
        schemaTypes: [schemaTypeAtPath.jsonType],
      })

      setCopyResult(payloadValue)
      const isWrittenToClipboard = await writeClipboardItem(payloadValue)

      if (!isWrittenToClipboard) {
        toast.push({
          status: 'error',
          title: t('copy-paste.on-copy.validation.clipboard-not-supported.title'),
        })
        return
      }

      const fields = payloadValue.items.map((item) => item.schemaTypeTitle).join('", "')

      toast.push({
        status: 'success',
        title: isDocument
          ? t('copy-paste.on-copy.validation.copy-document-success.title', {
              fieldNames: fields,
            })
          : t('copy-paste.on-copy.validation.copy-field_one-success.title', {
              fieldName: fields,
            }),
      })
    },
    [getDocumentMeta, setCopyResult, telemetry, toast, t],
  )

  const onPaste = useCallback(
    async (targetPath: Path, value: FormDocumentValue | undefined, options?: PasteOptions) => {
      const {schemaType: targetDocumentSchemaType} = getDocumentMeta()!
      const targetSchemaType = resolveSchemaTypeForPath(
        targetDocumentSchemaType!,
        targetPath,
        value,
      )!

      const clipboardItem = await getClipboardItem()

      // Return early if no clipboard item or if clipboard item is invalid
      if (!clipboardItem) {
        toast.push({
          status: 'info',
          title: t('copy-paste.on-paste.validation.clipboard-empty.title'),
        })
        return
      }

      if (!clipboardItem.documentType) {
        toast.push({
          status: 'error',
          title: t('copy-paste.on-paste.validation.clipboard-invalid.title'),
        })
        return
      }

      const sourceDocumentSchemaType = schema.get(clipboardItem.documentType)

      if (!sourceDocumentSchemaType) {
        toast.push({
          status: 'error',
          title: t('copy-paste.on-paste.validation.clipboard-invalid.title'),
        })
        return
      }

      const updateItems: {patches: FormPatch[]; targetSchemaTypeTitle: string}[] = []
      const copiedJsonTypes: string[] = []

      for (const item of clipboardItem.items) {
        const sourceSchemaType = resolveSchemaTypeForPath(
          sourceDocumentSchemaType,
          item.documentPath,
          value,
        )

        if (!sourceSchemaType) {
          toast.push({
            status: 'error',
            title: t('copy-paste.on-paste.validation.schema-type-incompatible.title', {
              path: PathUtils.toString(item.documentPath),
            }),
          })
          return
        }

        if (!targetDocumentSchemaType) {
          toast.push({
            status: 'error',
            title: t('copy-paste.on-paste.validation.schema-type-incompatible.title', {
              path: PathUtils.toString(targetPath),
            }),
          })
          return
        }

        const targetSchemaTypeTitle = targetSchemaType.title || targetSchemaType.name
        const transferValueOptions = {
          sourceRootSchemaType: sourceSchemaType,
          sourcePath: [],
          sourceValue: item.value,
          targetRootSchemaType: targetSchemaType,
          targetPath: [],
          options: {
            validateAssets: true,
            validateReferences: true,
            client,
          } as TransferValueOptions,
        }
        copiedJsonTypes.push(sourceSchemaType.jsonType)

        try {
          const {targetValue, errors} = await transferValue(transferValueOptions)
          const nonWarningErrors = errors.filter((error) => error.level !== 'warning')
          const _isEmptyValue = isEmptyValue(targetValue)

          if (nonWarningErrors.length > 0) {
            const description = t(nonWarningErrors[0].i18n.key, nonWarningErrors[0].i18n.args)

            toast.push({
              status: 'error',
              title: t('copy-paste.on-paste.validation.clipboard-invalid.title'),
              description,
            })
            return
          }

          if (errors.length > 0 && !_isEmptyValue) {
            const description = errors.map((error) => t(error.i18n.key, error.i18n.args)).join(', ')

            toast.push({
              status: 'warning',
              title: t('copy-paste.on-paste.validation.partial-warning.title'),
              description,
            })
          }

          if (_isEmptyValue) {
            toast.push({
              status: 'warning',
              title: t('copy-paste.on-paste.validation.clipboard-empty.title'),
            })
            return
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

      telemetry.log(FieldPasted, {
        context: options?.context?.source || 'unknown',
        schemaTypes: copiedJsonTypes,
      })

      if (updateItems.length) {
        const allPatches = flatten(updateItems.map(({patches}) => patches))
        const allTargetNames = updateItems
          .map(({targetSchemaTypeTitle}) => targetSchemaTypeTitle)
          .join('", "')

        onChange?.(PatchEvent.from(allPatches))

        if (clipboardItem.isDocument) {
          toast.push({
            status: 'success',
            title: t('copy-paste.on-paste.validation.document-paste-success.title', {
              fieldNames: allTargetNames,
            }),
          })

          return
        }

        const isSingleField = updateItems.length === 1

        if (isSingleField) {
          toast.push({
            status: 'success',
            title: t('copy-paste.on-paste.validation.field_one-paste-success.title', {
              fieldName: allTargetNames,
            }),
          })
        }
      }
    },
    [getDocumentMeta, schema, telemetry, toast, client, onChange, t],
  )

  return {onCopy, onPaste, onChange}
}
