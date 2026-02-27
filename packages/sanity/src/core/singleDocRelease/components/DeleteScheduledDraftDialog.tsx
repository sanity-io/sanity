import {type ReleaseDocument} from '@sanity/client'
import {type PreviewValue} from '@sanity/types'
import {Box, Checkbox, Flex, Stack, Text, useToast} from '@sanity/ui'
import {type ChangeEvent, type ReactNode, useCallback, useMemo, useState} from 'react'

import {Dialog} from '../../../ui-components'
import {LoadingBlock} from '../../components'
import {useSchema} from '../../hooks'
import {Translate, useTranslation} from '../../i18n'
import {Preview} from '../../preview'
import {type VersionInfoDocumentStub} from '../../releases/store/types'
import {useDocumentVersionInfo} from '../../releases/store/useDocumentVersionInfo'
import {getErrorMessage, getPublishedId} from '../../util'
import {useScheduledDraftDocument} from '../hooks/useScheduledDraftDocument'
import {useScheduleDraftOperations} from '../hooks/useScheduleDraftOperations'

interface DeleteScheduledDraftDialogBaseProps {
  onClose: () => void
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
  copy: {
    visible: boolean
    default: boolean
  }
}

function getDialogDescription(
  draftVersionInfo: VersionInfoDocumentStub | undefined,
  scheduledDraftBaseRev: string | undefined,
): DialogDescription {
  // No draft exists - automatically copy the scheduled draft
  if (!draftVersionInfo) {
    return {
      bodyKey: 'release.dialog.delete-schedule-draft.body-will-save-to-draft',
      copy: {visible: false, default: true},
    }
  }

  // Revisions match - automatically skip copying (already current)
  const revisionsMatch = scheduledDraftBaseRev === draftVersionInfo._rev
  if (revisionsMatch) {
    return {
      bodyKey: 'release.dialog.delete-schedule-draft.body-already-current',
      copy: {visible: false, default: false},
    }
  }

  // Different content - let user decide
  return {
    bodyKey: 'release.dialog.delete-schedule-draft.body-with-choice',
    copy: {visible: true, default: true},
  }
}

function useDeleteScheduledDraft(
  firstDocumentPreview: PreviewValue | undefined,
  onClose: () => void,
  deleteOperation: () => Promise<void>,
) {
  const {t} = useTranslation()
  const toast = useToast()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteSchedule = useCallback(async () => {
    setIsDeleting(true)
    // The run().catch().finally() syntax instead of try/catch/finally is because of the React Compiler not fully supporting the syntax yet
    const run = async () => {
      await deleteOperation()
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
      })
  }, [toast, t, firstDocumentPreview?.title, onClose, deleteOperation])

  return {isDeleting, handleDeleteSchedule}
}

/**
 * Shared Dialog component that renders the delete confirmation UI shell.
 */
function DeleteScheduledDraftDialogContent({
  onClose,
  handleDeleteSchedule,
  isDeleting,
  children,
}: {
  onClose: () => void
  handleDeleteSchedule: () => void
  isDeleting: boolean
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
          disabled: isDeleting,
          loading: isDeleting,
        },
      }}
    >
      <Stack space={3} paddingX={3} marginBottom={2}>
        {children}
      </Stack>
    </Dialog>
  )
}

export function DeleteScheduledDraftDialogWithCopyToDraft({
  documentId,
  documentType,
  onClose,
  release,
}: DeleteScheduledDraftDialogWithCopyToDraftProps) {
  const {t} = useTranslation()
  const schema = useSchema()
  const operations = useScheduleDraftOperations()

  const {firstDocument, firstDocumentPreview} = useScheduledDraftDocument(release._id, {
    includePreview: true,
  })

  const publishedId = useMemo(() => getPublishedId(documentId), [documentId])
  const {draft: draftVersionInfo} = useDocumentVersionInfo(publishedId)

  const dialogDescription = useMemo(() => {
    const scheduledDraftBaseRev = firstDocument?._system?.base?.rev
    return getDialogDescription(draftVersionInfo, scheduledDraftBaseRev)
  }, [draftVersionInfo, firstDocument])

  const [shouldCopyToDraft, setShouldCopyToDraft] = useState(dialogDescription.copy.default)

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
  )

  const schemaType = schema.get(documentType)

  return (
    <DeleteScheduledDraftDialogContent
      onClose={onClose}
      handleDeleteSchedule={handleDeleteSchedule}
      isDeleting={isDeleting}
    >
      {schemaType && firstDocument ? (
        <Preview value={firstDocument} schemaType={schemaType} />
      ) : (
        <LoadingBlock />
      )}
      <Box paddingX={2}>
        <Text size={1} muted>
          {t(dialogDescription.bodyKey)}
        </Text>
      </Box>
      {dialogDescription.copy.visible && (
        <>
          <Box paddingX={2}>
            <Text size={1} muted>
              {t('release.dialog.delete-schedule-draft.different-changes-explanation')}
            </Text>
          </Box>
          <Box paddingX={2}>
            <Flex align="center" gap={3} as="label">
              <Checkbox
                checked={shouldCopyToDraft}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setShouldCopyToDraft(event.currentTarget.checked)
                }
              />
              <Text size={1} muted>
                {t('release.dialog.delete-schedule-draft.copy-checkbox')}
              </Text>
            </Flex>
          </Box>
        </>
      )}
    </DeleteScheduledDraftDialogContent>
  )
}

/**
 * Used when there's no document in the release, avoiding unnecessary calls to useDocumentVersionInfo.
 */
function DeleteScheduledDraftDialogWithEmptyRelease({
  onClose,
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
  release,
}: DeleteScheduledDraftDialogProps) {
  if (!documentId || !documentType) {
    return <DeleteScheduledDraftDialogWithEmptyRelease onClose={onClose} release={release} />
  }

  return (
    <DeleteScheduledDraftDialogWithCopyToDraft
      documentId={documentId}
      documentType={documentType}
      onClose={onClose}
      release={release}
    />
  )
}
