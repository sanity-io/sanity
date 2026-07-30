import {useToast} from '@sanity/ui'
import {useCallback, useMemo} from 'react'

import {useClient} from '../../hooks/useClient'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../studioClient'
import {getPublishedId, getVersionId} from '../../util/draftUtils'
import {getDocumentVersionInfoFromVersions} from '../util/getDocumentVersionInfoFromVersions'
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

  const sourceDocumentId = useMemo(
    () => (fromRelease === 'published' ? documentId : getVersionId(documentId, fromRelease)),
    [documentId, fromRelease],
  )

  const {versions} = useDocumentVersions({documentId: publishedId})
  const hasDraftVersion = useMemo(
    () => Boolean(getDocumentVersionInfoFromVersions(versions).draft),
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
        const sourceDoc = await client.getDocument(sourceDocumentId)

        if (!sourceDoc) {
          throw new Error(`Source document ${sourceDocumentId} not found`)
        }

        if (hasDraftVersion) {
          await client.discardVersion({publishedId}, false)
        }

        await client.createVersion({
          baseId: sourceDocumentId,
          ifBaseRevisionId: sourceDoc._rev,
          publishedId,
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
      sourceDocumentId,
      hasDraftVersion,
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
