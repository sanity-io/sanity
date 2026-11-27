import {type Action} from '@sanity/client'
import {useTelemetry} from '@sanity/telemetry/react'
import {useToast} from '@sanity/ui/toast'
import {useCallback, useMemo} from 'react'

import {useClient} from '../../hooks/useClient'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../studioClient'
import {getDraftId} from '../../util/draftUtils'
import {getDocumentVersionVariantId} from '../../util/getDocumentVersionVariant'
import {getTargetDocument} from '../../util/getTargetDocument'
import {
  VariantVersionCreated,
  type VariantVersionCreatedLocation,
} from '../../variants/__telemetry__/variants.telemetry'
import {VARIANTS_STUDIO_CLIENT_OPTIONS} from '../../variants/store/constants'
import {getVariantId} from '../../variants/tool/util'
import {type VersionInfoDocumentStub} from '../store/types'
import {useDocumentVersions} from './useDocumentVersions'

export interface CopyToDraftsOptions {
  shouldConfirmDraftDiscard: boolean
}

export interface UseCopyToDraftsOptions {
  documentGroupId: string
  documentVersionInfoStub: VersionInfoDocumentStub | undefined
  /** The control the copy is made from, reported when it creates a variant version */
  location: VariantVersionCreatedLocation
  onNavigate: () => void
  onConfirmationRequest: () => void
}

export interface UseCopyToDraftsReturn {
  handleCopyToDrafts: (options: CopyToDraftsOptions) => Promise<void>
}

export function useCopyToDrafts(options: UseCopyToDraftsOptions): UseCopyToDraftsReturn {
  const {onNavigate, onConfirmationRequest, documentVersionInfoStub, documentGroupId, location} =
    options
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const variantsClient = useClient(VARIANTS_STUDIO_CLIENT_OPTIONS)
  const toast = useToast()
  const telemetry = useTelemetry()
  const {t} = useTranslation()

  const {versions} = useDocumentVersions({documentId: documentGroupId})
  const variantRef = getDocumentVersionVariantId(documentVersionInfoStub)
  const hasDraftVersion = useMemo(
    () =>
      Boolean(
        getTargetDocument({
          bundle: 'drafts',
          variant: variantRef,
          documentVersions: versions,
        }),
      ),
    [variantRef, versions],
  )

  const handleCopyToDrafts = useCallback(
    async ({shouldConfirmDraftDiscard}: CopyToDraftsOptions) => {
      if (shouldConfirmDraftDiscard && hasDraftVersion) {
        onConfirmationRequest()
        return
      }
      // Workaround for React Compiler not yet fully supporting try/catch syntax
      const run = async () => {
        if (!documentVersionInfoStub) {
          throw new Error(
            'Document version info stub is required, not found for document group id: ' +
              documentGroupId,
          )
        }
        if (documentVersionInfoStub._system.bundleId === 'drafts') {
          throw new Error('Cannot copy a draft onto itself')
        }
        const actions: Action[] = []

        const variantRef = getDocumentVersionVariantId(documentVersionInfoStub)
        if (variantRef) {
          const variantId = getVariantId(variantRef)

          if (hasDraftVersion) {
            actions.push({
              actionType: 'sanity.action.document.variant.delete',
              bundleId: 'drafts',
              publishedId: documentGroupId,
              variantId,
            })
          }

          actions.push({
            actionType: 'sanity.action.document.variant.create',
            bundleId: 'drafts',
            publishedId: documentGroupId,
            variantId,
            baseId: documentVersionInfoStub._id,
            ifBaseRevisionId: documentVersionInfoStub._rev,
          })
        } else {
          if (hasDraftVersion) {
            actions.push({
              actionType: 'sanity.action.document.discard',
              draftId: getDraftId(documentGroupId),
            })
          }

          actions.push({
            actionType: 'sanity.action.document.version.create',
            versionId: getDraftId(documentGroupId),
            baseId: documentVersionInfoStub._id,
            ifBaseRevisionId: documentVersionInfoStub._rev,
            publishedId: documentGroupId,
          })
        }

        const actionClient = variantRef ? variantsClient : client
        await actionClient.action(actions, {
          tag: 'document.copy-to-drafts',
        })
        if (variantRef) {
          telemetry.log(VariantVersionCreated, {
            location,
            bundle: 'drafts',
            fromExistingVersion: true,
          })
        }

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
      variantsClient,
      documentVersionInfoStub,
      hasDraftVersion,
      documentGroupId,
      location,
      telemetry,
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
