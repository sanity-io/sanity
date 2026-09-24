import {type ReleaseDocument, type SanityDocument} from '@sanity/client'
import {type PreviewValue} from '@sanity/types'
import {Checkbox, Text} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
import {dequal} from 'dequal/lite'
import omit from 'lodash-es/omit.js'
import {type ChangeEvent, type ReactNode, useCallback, useMemo, useState} from 'react'
import {Box, Flex} from 'ui5'

import {Dialog} from '../../../ui-components/dialog/Dialog'
import {LoadingBlock} from '../../components/loadingBlock/LoadingBlock'
import {useSchema} from '../../hooks/useSchema'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {Translate} from '../../i18n/Translate'
import {Preview} from '../../preview/components/Preview'
import {useUnstableObserveDocument} from '../../preview/useObserveDocument'
import {getReleaseIdFromReleaseDocumentId} from '../../releases/util/getReleaseIdFromReleaseDocumentId'
import {RELEASES_STUDIO_CLIENT_OPTIONS} from '../../releases/util/releasesClient'
import {getDraftId, getPublishedId, getVersionId} from '../../util/draftUtils'
import {getErrorMessage} from '../../util/getErrorMessage'
import {useScheduledDraftDocument} from '../hooks/useScheduledDraftDocument'
import {useScheduleDraftOperations} from '../hooks/useScheduleDraftOperations'

interface DeleteScheduledDraftDialogBaseProps {
  onClose: () => void
  onDeleteComplete?: () => void
  release: ReleaseDocument
}

interface DeleteScheduledDraftDialogProps extends DeleteScheduledDraftDialogBaseProps {
  documentId: string | undefined
  documentType?: string
}

interface DeleteScheduledDraftDialogWithCopyToDraftProps extends DeleteScheduledDraftDialogBaseProps {
  documentId: string
  documentType: string
}

interface DialogDescription {
  bodyKey: string
  explanationKey?: string
  copy: {
    visible: boolean
    default: boolean
  }
}

const NON_CONTENT_FIELDS = ['_id', '_rev', '_createdAt', '_updatedAt', '_system']

function isSameDocumentContent(documentA: SanityDocument, documentB: SanityDocument): boolean {
  return dequal(omit(documentA, NON_CONTENT_FIELDS), omit(documentB, NON_CONTENT_FIELDS))
}

function getDialogDescription(
  scheduledDraftDocument: SanityDocument | null,
  draftDocument: SanityDocument | null,
  scheduledDraftError: unknown,
  draftError: unknown,
): DialogDescription {
  // An unreadable document is unknown, not absent: copying could overwrite a draft we never saw,
  // or copy content from a scheduled draft we never saw.
  if (draftError) {
    return {
      bodyKey: 'release.dialog.delete-schedule-draft.body-with-choice',
      explanationKey: 'release.dialog.delete-schedule-draft.unresolved-draft-explanation',
      copy: {visible: true, default: false},
    }
  }

  if (scheduledDraftError) {
    return {
      bodyKey: 'release.dialog.delete-schedule-draft.body-with-choice',
      explanationKey: 'release.dialog.delete-schedule-draft.unresolved-scheduled-draft-explanation',
      copy: {visible: true, default: false},
    }
  }

  if (scheduledDraftDocument && draftDocument) {
    return isSameDocumentContent(scheduledDraftDocument, draftDocument)
      ? {
          bodyKey: 'release.dialog.delete-schedule-draft.body-already-current',
          copy: {visible: false, default: false},
        }
      : {
          bodyKey: 'release.dialog.delete-schedule-draft.body-with-choice',
          explanationKey: 'release.dialog.delete-schedule-draft.different-changes-explanation',
          copy: {visible: true, default: true},
        }
  }

  if (scheduledDraftDocument) {
    return {
      bodyKey: 'release.dialog.delete-schedule-draft.body-will-save-to-draft',
      copy: {visible: false, default: true},
    }
  }

  // The version is missing; copying is a no-op, so prefer it over claiming nothing is at stake.
  return {
    bodyKey: 'release.dialog.delete-schedule-draft.body-with-choice',
    copy: {visible: false, default: true},
  }
}

function useDeleteScheduledDraft(
  firstDocumentPreview: PreviewValue | undefined,
  onClose: () => void,
  deleteOperation: () => Promise<void>,
  onDeleteComplete?: () => void,
) {
  const {t} = useTranslation()
  const toast = useToast()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteSchedule = useCallback(async () => {
    setIsDeleting(true)
    let didDelete = false
    // The run().catch().finally() syntax instead of try/catch/finally is because of the React Compiler not fully supporting the syntax yet
    const run = async () => {
      await deleteOperation()
      didDelete = true
      toast.push({
        closable: true,
        status: 'success',
        description: (
          <Translate
            t={t}
            i18nKey="release.toast.delete-schedule-draft.success"
            values={{title: firstDocumentPreview?.title || t('preview.default.title-fallback')}}
          />
        ),
      })
    }
    await run()
      .catch((error) => {
        console.error('Failed to delete scheduled draft:', error)
        toast.push({
          closable: true,
          status: 'error',
          description: (
            <Translate
              t={t}
              i18nKey="release.toast.delete-schedule-draft.error"
              values={{
                title: firstDocumentPreview?.title || t('preview.default.title-fallback'),
                error: getErrorMessage(error),
              }}
            />
          ),
        })
      })
      .finally(() => {
        setIsDeleting(false)
        onClose()
        if (didDelete) {
          try {
            onDeleteComplete?.()
          } catch (error) {
            console.error('onDeleteComplete callback failed:', error)
          }
        }
      })
  }, [toast, t, firstDocumentPreview?.title, onClose, deleteOperation, onDeleteComplete])

  return {isDeleting, handleDeleteSchedule}
}

/**
 * Shared Dialog component that renders the delete confirmation UI shell.
 */
function DeleteScheduledDraftDialogContent({
  onClose,
  handleDeleteSchedule,
  isDeleting,
  confirmDisabled = false,
  children,
}: {
  onClose: () => void
  handleDeleteSchedule: () => void
  isDeleting: boolean
  confirmDisabled?: boolean
  children: ReactNode
}) {
  const {t} = useTranslation()

  return (
    <Dialog
      id="delete-schedule-dialog"
      header={t('release.dialog.delete-schedule-draft.header')}
      onClose={onClose}
      width={0}
      padding={false}
      footer={{
        cancelButton: {
          disabled: isDeleting,
          onClick: onClose,
        },
        confirmButton: {
          text: t('release.dialog.delete-schedule-draft.confirm'),
          tone: 'critical',
          onClick: handleDeleteSchedule,
          disabled: isDeleting || confirmDisabled,
          loading: isDeleting,
        },
      }}
    >
      <Flex gap={3} paddingX={3} marginBottom={2} flexDirection="column">
        {children}
      </Flex>
    </Dialog>
  )
}

function DeleteScheduledDraftDialogWithCopyToDraft({
  documentId,
  documentType,
  onClose,
  onDeleteComplete,
  release,
}: DeleteScheduledDraftDialogWithCopyToDraftProps) {
  const {t} = useTranslation()
  const schema = useSchema()
  const operations = useScheduleDraftOperations()

  const publishedId = getPublishedId(documentId)
  const releaseId = getReleaseIdFromReleaseDocumentId(release._id)

  const {firstDocument, firstDocumentPreview} = useScheduledDraftDocument(release._id, {
    includePreview: true,
  })

  // Same observer both sides: `useScheduledDraftDocument` decorates documents with extra keys.
  // The releases api config matches `useBundleDocuments`, so the version read shares its observable.
  const {
    document: scheduledDraftDocument,
    loading: scheduledDraftLoading,
    error: scheduledDraftError,
  } = useUnstableObserveDocument<SanityDocument>(
    getVersionId(publishedId, releaseId),
    RELEASES_STUDIO_CLIENT_OPTIONS,
  )
  const {
    document: draftDocument,
    loading: draftLoading,
    error: draftError,
  } = useUnstableObserveDocument<SanityDocument>(
    getDraftId(publishedId),
    RELEASES_STUDIO_CLIENT_OPTIONS,
  )

  const isLoading = scheduledDraftLoading || draftLoading

  const dialogDescription = useMemo(
    () =>
      getDialogDescription(scheduledDraftDocument, draftDocument, scheduledDraftError, draftError),
    [scheduledDraftDocument, draftDocument, scheduledDraftError, draftError],
  )

  const [copyOverride, setCopyOverride] = useState<boolean | undefined>(undefined)
  const shouldCopyToDraft = copyOverride ?? dialogDescription.copy.default

  const deleteOperation = useCallback(async () => {
    const shouldCopy = dialogDescription.copy.visible
      ? shouldCopyToDraft
      : dialogDescription.copy.default

    await operations.deleteScheduledDraft(release._id, shouldCopy, publishedId)
  }, [release._id, operations, dialogDescription, shouldCopyToDraft, publishedId])

  const {isDeleting, handleDeleteSchedule} = useDeleteScheduledDraft(
    firstDocumentPreview,
    onClose,
    deleteOperation,
    onDeleteComplete,
  )

  const schemaType = schema.get(documentType)

  return (
    <DeleteScheduledDraftDialogContent
      onClose={onClose}
      handleDeleteSchedule={handleDeleteSchedule}
      isDeleting={isDeleting}
      confirmDisabled={isLoading}
    >
      {schemaType && firstDocument ? (
        <Preview value={firstDocument} schemaType={schemaType} />
      ) : (
        <LoadingBlock />
      )}
      {isLoading ? (
        <LoadingBlock />
      ) : (
        <>
          <Box paddingX={2}>
            <Text size={1} muted>
              {t(dialogDescription.bodyKey)}
            </Text>
          </Box>
          {dialogDescription.copy.visible && (
            <>
              {dialogDescription.explanationKey && (
                <Box paddingX={2}>
                  <Text size={1} muted>
                    {t(dialogDescription.explanationKey)}
                  </Text>
                </Box>
              )}
              <Box paddingX={2}>
                <Flex alignItems="center" gap={3} as="label">
                  <Checkbox
                    checked={shouldCopyToDraft}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setCopyOverride(event.currentTarget.checked)
                    }
                  />
                  <Text size={1} muted>
                    {t('release.dialog.delete-schedule-draft.copy-checkbox')}
                  </Text>
                </Flex>
              </Box>
            </>
          )}
        </>
      )}
    </DeleteScheduledDraftDialogContent>
  )
}

/**
 * Used when there's no document in the release, avoiding unnecessary document fetches.
 */
function DeleteScheduledDraftDialogWithEmptyRelease({
  onClose,
  onDeleteComplete,
  release,
}: DeleteScheduledDraftDialogBaseProps) {
  const {t} = useTranslation()
  const operations = useScheduleDraftOperations()

  const {firstDocumentPreview} = useScheduledDraftDocument(release._id, {
    includePreview: true,
  })

  const deleteOperation = useCallback(async () => {
    await operations.deleteScheduledDraft(release._id, false, undefined)
  }, [release._id, operations])

  const {isDeleting, handleDeleteSchedule} = useDeleteScheduledDraft(
    firstDocumentPreview,
    onClose,
    deleteOperation,
    onDeleteComplete,
  )

  return (
    <DeleteScheduledDraftDialogContent
      onClose={onClose}
      handleDeleteSchedule={handleDeleteSchedule}
      isDeleting={isDeleting}
    >
      <Box paddingX={2}>
        <Text size={1} muted>
          {t('release.dialog.delete-schedule-draft.body-already-current')}
        </Text>
      </Box>
    </DeleteScheduledDraftDialogContent>
  )
}

export function DeleteScheduledDraftDialog({
  documentId,
  documentType,
  onClose,
  onDeleteComplete,
  release,
}: DeleteScheduledDraftDialogProps) {
  if (!documentId || !documentType) {
    return (
      <DeleteScheduledDraftDialogWithEmptyRelease
        onClose={onClose}
        onDeleteComplete={onDeleteComplete}
        release={release}
      />
    )
  }

  return (
    <DeleteScheduledDraftDialogWithCopyToDraft
      documentId={documentId}
      documentType={documentType}
      onClose={onClose}
      onDeleteComplete={onDeleteComplete}
      release={release}
    />
  )
}
