import {useToast} from '@sanity/ui'
import {useCallback, useMemo} from 'react'

import {useClient} from '../../hooks/useClient'
import {useTranslation} from '../../i18n'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../studioClient'
import {getPublishedId, getVersionId} from '../../util/draftUtils'
import {useDocumentVersionInfo} from '../store/useDocumentVersionInfo'

export interface UseCopyToDraftsOptions {
  documentId: string
  fromRelease: string
  onNavigate: () => void
}

export interface UseCopyToDraftsReturn {
  handleCopyToDrafts: () => Promise<void>
  hasDraftVersion: boolean
}

export function useCopyToDrafts(options: UseCopyToDraftsOptions) {
  const {documentId, fromRelease, onNavigate} = options
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const toast = useToast()
  const {t} = useTranslation()

  const publishedId = useMemo(() => getPublishedId(documentId), [documentId])

  const sourceDocumentId = useMemo(
    () => (fromRelease === 'published' ? documentId : getVersionId(documentId, fromRelease)),
    [documentId, fromRelease],
  )

  const documentVersionInfo = useDocumentVersionInfo(publishedId)
  const hasDraftVersion = Boolean(documentVersionInfo.draft)

  const handleCopyToDrafts = useCallback(async () => {
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
  }, [client, sourceDocumentId, hasDraftVersion, publishedId, toast, onNavigate, t])

  return {
    handleCopyToDrafts,
    hasDraftVersion,
  }
}
