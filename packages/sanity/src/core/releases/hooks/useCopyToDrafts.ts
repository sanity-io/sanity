import {type Action} from '@sanity/client'
import {useToast} from '@sanity/ui'
import {useCallback, useMemo} from 'react'

import {useClient} from '../../hooks/useClient'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../studioClient'
import {getPublishedId, getDraftId} from '../../util/draftUtils'
import {getTargetDocument} from '../../util/getTargetDocument'
import {type VariantDocumentAction} from '../../variants/store/variantsClient'
import {getVariantId} from '../../variants/tool/util'
import {useDocumentVersions} from './useDocumentVersions'

export interface CopyToDraftsOptions {
  shouldConfirmDraftDiscard: boolean
}

export interface UseCopyToDraftsOptions {
  documentId: string
  fromRelease: string
  /**
   * The variant reference (`_.variants.<id>`) of the version being copied. When
   * set, the copy targets the variant's draft rather than the base draft.
   */
  fromVariant?: string
  onNavigate: () => void
  onConfirmationRequest: () => void
}

export interface UseCopyToDraftsReturn {
  handleCopyToDrafts: (options: CopyToDraftsOptions) => Promise<void>
}

export function useCopyToDrafts(options: UseCopyToDraftsOptions): UseCopyToDraftsReturn {
  const {documentId, fromRelease, fromVariant, onNavigate, onConfirmationRequest} = options
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const toast = useToast()
  const {t} = useTranslation()

  const publishedId = useMemo(() => getPublishedId(documentId), [documentId])
  const {versions} = useDocumentVersions({documentId: publishedId})
  const sourceDocumentInfo = useMemo(() => {
    if (fromRelease === 'draft') {
      return undefined
    }
    if (fromRelease === 'published') {
      return getTargetDocument({
        bundle: 'published',
        variant: fromVariant,
        documentVersions: versions,
      })
    }
    return versions.find((version) => {
      const inVariant = fromVariant
        ? version._system.variant?._ref === fromVariant
        : !version._system.variant
      // `fromRelease` matches a base version's `scopeId`, but a variant version's `scopeId`
      // is its variant scope, so variant versions are matched by their bundle instead.
      const inBundle = fromVariant
        ? version._system.bundleId === fromRelease
        : version._system.scopeId === fromRelease
      return inVariant && inBundle
    })
  }, [fromRelease, fromVariant, versions])

  const hasDraftVersion = useMemo(
    () =>
      Boolean(
        getTargetDocument({bundle: 'drafts', variant: fromVariant, documentVersions: versions}),
      ),
    [fromVariant, versions],
  )

  const handleCopyToDrafts = useCallback(
    async ({shouldConfirmDraftDiscard}: CopyToDraftsOptions) => {
      if (shouldConfirmDraftDiscard && hasDraftVersion) {
        onConfirmationRequest()
        return
      }
      // Workaround for React Compiler not yet fully supporting try/catch syntax
      const run = async () => {
        if (!sourceDocumentInfo) {
          throw new Error(
            `Source document with id: ${documentId} and release: ${fromRelease} not found`,
          )
        }
        const actions: (Action | VariantDocumentAction)[] = []

        if (fromVariant) {
          const variantId = getVariantId(fromVariant)

          if (hasDraftVersion) {
            actions.push({
              actionType: 'sanity.action.document.variant.delete',
              bundleId: 'drafts',
              publishedId,
              variantId,
            })
          }

          actions.push({
            actionType: 'sanity.action.document.variant.create',
            bundleId: 'drafts',
            publishedId,
            variantId,
            baseId: sourceDocumentInfo._id,
            ifBaseRevisionId: sourceDocumentInfo._rev,
          })
        } else {
          if (hasDraftVersion) {
            actions.push({
              actionType: 'sanity.action.document.discard',
              draftId: getDraftId(publishedId),
            })
          }

          actions.push({
            actionType: 'sanity.action.document.version.create',
            versionId: getDraftId(publishedId),
            baseId: sourceDocumentInfo._id,
            ifBaseRevisionId: sourceDocumentInfo._rev,
            publishedId,
          })
        }

        // `client.action` is not typed for variant actions yet; see `variantsClient`.
        await client.action(actions as Action[], {
          tag: 'document.copy-to-drafts',
        })

        onNavigate()
      }
      try {
        await run()
      } catch (err) {
        toast.push({
          closable: true,
          status: 'error',
          title: t('release.action.create-version.failure'),
          description: err.message,
        })
      }
    },
    [
      client,
      documentId,
      fromRelease,
      fromVariant,
      hasDraftVersion,
      sourceDocumentInfo,
      publishedId,
      toast,
      onNavigate,
      t,
      onConfirmationRequest,
    ],
  )

  return {
    handleCopyToDrafts,
  }
}
