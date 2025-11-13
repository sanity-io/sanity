import {type ReleaseDocument} from '@sanity/client'
import {type PreviewValue} from '@sanity/types'
import {Box, Checkbox, Flex, Stack, Text, useToast} from '@sanity/ui'
import {
  type ChangeEvent,
  type ReactNode,
  useCallback,
  useMemo,
  useState,
  useTransition,
} from 'react'

import {Dialog} from '../../../ui-components'
import {LoadingBlock} from '../../components'
import {useSchema} from '../../hooks'
import {Translate, useTranslation} from '../../i18n'
import {Preview} from '../../preview'
import {useDocumentVersionInfo} from '../../releases/store/useDocumentVersionInfo'
import {getErrorMessage, getPublishedId} from '../../util'
import {useScheduledDraftDocument} from '../hooks/useScheduledDraftDocument'
import {useScheduleDraftOperations} from '../hooks/useScheduleDraftOperations'

interface DeleteScheduledDraftDialogProps {
  onClose: () => void
  release: ReleaseDocument
  documentId: string | undefined
  documentType?: string
}

function useDeleteScheduledDraft(
  firstDocumentPreview: PreviewValue | undefined,
  onClose: () => void,
  deleteOperation: () => Promise<void>,
) {
  const {t} = useTranslation()
  const toast = useToast()
  const [isDeleting, startTransition] = useTransition()

  const handleDeleteSchedule = useCallback(
    () =>
      startTransition(async () => {
        try {
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
        } catch (error) {
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
        } finally {
          onClose()
        }
      }),
    [deleteOperation, toast, t, firstDocumentPreview?.title, onClose],
  )

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

export function DeleteScheduledDraftDialog(props: DeleteScheduledDraftDialogProps) {
  const {documentId} = props

  if (documentId) {
    return <DeleteScheduledDraftDialogWithCopyToDraft {...props} documentId={documentId} />
  }

  return <DeleteScheduledDraftDialogWithEmptyRelease {...props} />
}

function DeleteScheduledDraftDialogWithCopyToDraft({
  onClose,
  release,
  documentType,
  documentId,
}: DeleteScheduledDraftDialogProps & {documentId: string}) {
  const {t} = useTranslation()
  const schema = useSchema()
  const operations = useScheduleDraftOperations()

  const {firstDocument, firstDocumentPreview} = useScheduledDraftDocument(release._id, {
    includePreview: true,
  })
  const schemaType = documentType ? schema.get(documentType) : null

  const publishedId = useMemo(() => getPublishedId(documentId), [documentId])
  const documentVersionInfo = useDocumentVersionInfo(publishedId)
  const draftDocument = documentVersionInfo.draft

  const {showCopyCheckbox, shouldCopyByDefault} = useMemo(() => {
    if (!draftDocument) {
      return {showCopyCheckbox: false, shouldCopyByDefault: true}
    }

    const scheduledDraftBaseRev = firstDocument?._system?.base?.rev
    const draftRev = draftDocument._rev

    // if the revision Ids on the current draft and the scheduled draft are the same
    // don't need checkbox confirmation, no need to copy back to draft
    if (scheduledDraftBaseRev && draftRev && scheduledDraftBaseRev === draftRev) {
      return {showCopyCheckbox: false, shouldCopyByDefault: false}
    }

    return {showCopyCheckbox: true, shouldCopyByDefault: true}
  }, [draftDocument, firstDocument])

  const [shouldCopyToDraft, setShouldCopyToDraft] = useState(shouldCopyByDefault)

  const deleteOperation = useCallback(async () => {
    const shouldCopy = showCopyCheckbox ? shouldCopyToDraft : shouldCopyByDefault
    await operations.deleteScheduledDraft(release._id, shouldCopy, publishedId)
  }, [
    release._id,
    operations,
    showCopyCheckbox,
    shouldCopyToDraft,
    shouldCopyByDefault,
    publishedId,
  ])

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
      {schemaType && firstDocument ? (
        <Preview value={firstDocument} schemaType={schemaType} />
      ) : (
        <LoadingBlock />
      )}
      <Box paddingX={2}>
        <Text size={1} muted>
          {t('release.dialog.delete-schedule-draft.body')}
        </Text>
      </Box>
      {showCopyCheckbox && (
        <>
          <Box paddingX={2}>
            <Text size={1} muted>
              {t('release.dialog.delete-schedule-draft.copy-warning')}
            </Text>
          </Box>
          <Box paddingX={2}>
            <Flex align="center" gap={3}>
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
}: DeleteScheduledDraftDialogProps) {
  const {t} = useTranslation()
  const operations = useScheduleDraftOperations()

  const {firstDocumentPreview} = useScheduledDraftDocument(release._id, {
    includePreview: true,
  })

  const deleteOperation = useCallback(async () => {
    await operations.deleteScheduledDraft(release._id, false)
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
          {t('release.dialog.delete-schedule-draft.body')}
        </Text>
      </Box>
    </DeleteScheduledDraftDialogContent>
  )
}
