/* eslint-disable max-statements */
import {useTelemetry} from '@sanity/telemetry/react'
import {isIndexSegment, isKeySegment, type Path, type PathSegment} from '@sanity/types'
import {useToast} from '@sanity/ui'
import * as PathUtils from '@sanity/util/paths'
import {flatten, isEqual, last} from 'lodash'
import {type ReactNode, useCallback, useContext, useMemo, useState} from 'react'
import {CopyPasteContext} from 'sanity/_singletons'

import {
  type FormDocumentValue,
  type FormPatch,
  getPublishedId,
  getValueAtPath,
  insert,
  PatchEvent,
  set,
  setIfMissing,
  useClient,
  useCurrentUser,
  useSchema,
  useTranslation,
} from '../..'
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
  const currentUser = useCurrentUser()

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

      const lastSegment = path.length > 0 ? (last(path) as PathSegment) : undefined
      const isLastSegmentKeyOrIndex =
        lastSegment && (isKeySegment(lastSegment) || isIndexSegment(lastSegment))

      // If copying an array item, we always set the patch type to append
      // This only means that it will be appended IF the target schema type is an array
      const isAppend =
        options.context.source === 'arrayItem' ||
        isLastSegmentKeyOrIndex ||
        options.patchType === 'append'
      const normalizedPath = isAppend && isLastSegmentKeyOrIndex ? path.slice(0, -1) : path
      const patchType = isAppend ? 'append' : 'replace'

      // If append and the last path segment is a key or index segment, remove it and wrap in array
      // This simplifies the logic when we want to paste into another document that can't look up existing
      // value by key or index
      const shouldWrapInArray = isLastSegmentKeyOrIndex && !Array.isArray(valueAtPath)

      const isArrayItem = options.context.source === 'arrayItem'
      const payloadValue: SanityClipboardItem = {
        type: 'sanityClipboardItem',
        documentId,
        documentType,
        isDocument,
        schemaTypeName: schemaTypeAtPath.name,
        valuePath: normalizedPath,
        value: shouldWrapInArray ? [valueAtPath] : valueAtPath,
        patchType,
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
      }
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
        targetDocumentSchemaType: targetDocumentSchemaType,
        sourceRootSchemaType: sourceSchemaType,
        sourcePath: [],
        sourceRootPath: clipboardItem.valuePath,
        sourceValue: clipboardItem.value,
        targetRootSchemaType: targetSchemaType,
        targetPath: [],
        // This will mainly be used for validating references with filter callback that
        // needs the document and absolute path to the field
        targetRootPath: targetPath,
        targetRootValue: value,
        currentUser,
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

        const patchType = clipboardItem?.patchType || 'replace'

        // If transferring a non-array value into an array, we need to append to it instead
        const isAppendable =
          (clipboardItem.schemaTypeName !== 'array' && targetSchemaType.jsonType === 'array') ||
          patchType === 'append'

        // When pasting into an array, we need to insert the value at the correct index
        const isAppendPath = isAppendable && targetPath.length > 0
        const isAppendArray = isAppendPath && targetSchemaType.jsonType === 'array'
        const insertPath =
          isAppendable && targetPath.length > 0
            ? [...targetPath.slice(0, -1), `${targetPath.slice(-1)?.[0]}[-1]`]
            : targetPath

        // Always ensure the array exists
        const prefixPatches =
          targetSchemaType.jsonType === 'array' ? [setIfMissing([], targetPath)] : []

        updateItems.push({
          patches: isAppendArray
            ? [...prefixPatches, insert(targetValue as unknown[], 'after', insertPath)]
            : [...prefixPatches, set(targetValue, targetPath)],
          targetSchemaTypeTitle,
        })
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
        onChange(PatchEvent.from(allPatches))
        // TODO: missing case with multiple updated items?
      }
    },
    [documentMeta, schema, currentUser, client, telemetry, toast, t],
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
