import {type Action} from '@sanity/client'
import {useToast} from '@sanity/ui'
import {useCallback, useMemo} from 'react'

import {useClient} from '../../hooks/useClient'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../studioClient'
import {getPublishedId, getDraftId} from '../../util/draftUtils'
import {getTargetDocument} from '../../util/getTargetDocument'
import {isPublishedVersion} from '../../util/versionsUtils'
import {useDocumentVersions} from './useDocumentVersions'

export interface CopyToDraftsOptions {
  shouldConfirmDraftDiscard: boolean
}

export interface UseCopyToDraftsOptions {
  documentId: string
  fromRelease: string
  onNavigate: () => void
  onConfirmationRequest: () => void
}

export interface UseCopyToDraftsReturn {
  handleCopyToDrafts: (options: CopyToDraftsOptions) => Promise<void>
}

export function useCopyToDrafts(options: UseCopyToDraftsOptions): UseCopyToDraftsReturn {
  const {documentId, fromRelease, onNavigate, onConfirmationRequest} = options
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const toast = useToast()
  const {t} = useTranslation()

  const publishedId = useMemo(() => getPublishedId(documentId), [documentId])
  const {versions} = useDocumentVersions({documentId: publishedId})
  const sourceDocumentInfo = useMemo(() => {
    if (fromRelease === 'published') {
      return getTargetDocument({
        bundle: 'published',
        variant: undefined,
        documentVersions: versions,
      })
    }
    if (fromRelease === 'draft') {
      return undefined
    }
    return versions.find((version) => {
      // FromRelease now matches the scopeId of the version.
      // So it will find the correct document, in the follow up enabling copying variants
      // We need to check the variant and the release
      // For that we can use the `getTargetDocument` function
      return version._system.scopeId === fromRelease
    })
  }, [fromRelease, versions])

  const hasDraftVersion = useMemo(
    () =>
      Boolean(
        getTargetDocument({bundle: 'drafts', variant: undefined, documentVersions: versions}),
      ),
    [versions],
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
        if (sourceDocumentInfo._system.variant?._ref) {
          throw new Error('Copying variant documents to drafts is not supported yet')
        }

        const actions: Action[] = []

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
        await client.action(actions, {
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
