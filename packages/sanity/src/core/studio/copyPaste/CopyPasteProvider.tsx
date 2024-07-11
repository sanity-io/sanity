/* eslint-disable max-statements */
import {useTelemetry} from '@sanity/telemetry/react'
import {useToast} from '@sanity/ui'
import * as PathUtils from '@sanity/util/paths'
import {flatten, isEqual} from 'lodash'
import {type ReactNode, useCallback, useContext, useMemo, useState} from 'react'
import {
  type FormDocumentValue,
  type FormPatch,
  getPublishedId,
  getValueAtPath,
  PatchEvent,
  type Path,
  set,
  useClient,
  useSchema,
  useTranslation,
} from 'sanity'
import {CopyPasteContext} from 'sanity/_singletons'

import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../studioClient'
import {FieldCopied, FieldPasted} from './__telemetry__/copyPaste.telemetry'
import {resolveSchemaTypeForPath} from './resolveSchemaTypeForPath'
import {transferValue, type TransferValueOptions} from './transferValue'
import {
  type CopyOptions,
  type DocumentMeta,
  type PasteOptions,
  type SanityClipboardItem,
} from './types'
import {getClipboardItem, isEmptyValue, writeClipboardItem} from './utils'
/**
 * @beta
 * @hidden
 */
export const CopyPasteProvider: React.FC<{
  children: ReactNode
}> = ({children}) => {
  const toast = useToast()
  const telemetry = useTelemetry()
  const schema = useSchema()

  const {t} = useTranslation('copy-paste')
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)

  const [documentMeta, setDocumentMetaState] = useState<DocumentMeta | null>(null)

  const setDocumentMeta = useCallback(
    ({documentId, documentType, schemaType, onChange}: DocumentMeta) => {
      const processedMeta = {
        documentId: getPublishedId(documentId),
        documentType,
        schemaType,
        onChange,
      }

      setDocumentMetaState((prevMeta) => {
        if (isEqual(prevMeta, processedMeta)) {
          return prevMeta // No update if the new meta is the same as the current
        }
        return processedMeta
      })
    },
    [],
  )

  const onCopy = useCallback(
    async (path: Path, value: FormDocumentValue | undefined, options: CopyOptions) => {
      // guard against `documentMeta` having not been set yet
      if (!documentMeta) return

      const {documentId, documentType, schemaType} = documentMeta

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
      const valueAtPath = getValueAtPath(value, path)

      // Test if the value is empty (undefined, empty object or empty array)
      if (isEmptyValue(valueAtPath)) {
        toast.push({
          status: 'warning',
          title: t('copy-paste.on-copy.validation.no-value.title'),
        })
        return
      }

      const payloadValue: SanityClipboardItem = {
        type: 'sanityClipboardItem',
        documentId,
        documentType,
        isDocument,
        schemaTypeName: schemaTypeAtPath.name,
        valuePath: path,
        value: valueAtPath,
      }

      telemetry.log(FieldCopied, {
        context: options?.context?.source || 'unknown',
        schemaTypes: [schemaTypeAtPath.jsonType],
      })

      const isWrittenToClipboard = await writeClipboardItem(payloadValue)

      if (!isWrittenToClipboard) {
        toast.push({
          status: 'error',
          title: t('copy-paste.on-copy.validation.clipboard-not-supported.title'),
        })
        return
      }

      const fields = schemaTypeAtPath.title || schemaType.name || 'unknown'

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
    [documentMeta, telemetry, toast, t],
  )

  const onPaste = useCallback(
    async (targetPath: Path, value: FormDocumentValue | undefined, options: PasteOptions) => {
      // guard against `documentMeta` having not been set yet
      if (!documentMeta) return

      const {schemaType: targetDocumentSchemaType, onChange} = documentMeta
      const targetSchemaType = resolveSchemaTypeForPath(
        targetDocumentSchemaType,
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

      const sourceSchemaType = resolveSchemaTypeForPath(
        sourceDocumentSchemaType,
        clipboardItem.valuePath,
        value,
      )

      if (!sourceSchemaType) {
        toast.push({
          status: 'error',
          title: t('copy-paste.on-paste.validation.schema-type-incompatible.title', {
            path: PathUtils.toString(clipboardItem.valuePath),
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
        sourceValue: clipboardItem.value,
        targetRootSchemaType: targetSchemaType,
        targetPath: [],
        // This will mainly be used for validating references with filter callback that
        // needs the document and absolute path to the field
        targetRootPath: targetPath,
        targetRootValue: value,
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

      telemetry.log(FieldPasted, {
        context: options?.context?.source || 'unknown',
        schemaTypes: copiedJsonTypes,
      })

      if (updateItems.length) {
        const allPatches = flatten(updateItems.map(({patches}) => patches))
        const allTargetNames = updateItems.map((i) => i.targetSchemaTypeTitle).join('", "')

        onChange(PatchEvent.from(allPatches))

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

        // TODO: missing case with multiple updated items?
      }
    },
    [documentMeta, schema, telemetry, toast, client, t],
  )

  const contextValue = useMemo(
    () => ({
      setDocumentMeta,
      onCopy,
      onPaste,
    }),
    [onCopy, onPaste, setDocumentMeta],
  )

  return <CopyPasteContext.Provider value={contextValue}>{children}</CopyPasteContext.Provider>
}

/**
 * @beta
 * @hidden
 */
export const useCopyPaste = () => {
  const context = useContext(CopyPasteContext)
  if (!context) {
    throw new Error('useCopyPaste must be used within a CopyPasteProvider')
  }
  return context
}
