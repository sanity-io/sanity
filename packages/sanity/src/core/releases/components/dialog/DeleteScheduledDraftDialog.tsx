import {type ReleaseDocument} from '@sanity/client'
import {Box, Stack, Text} from '@sanity/ui'
import {useCallback, useState} from 'react'

import {Dialog} from '../../../../ui-components'
import {LoadingBlock} from '../../../components'
import {useSchema} from '../../../hooks'
import {useTranslation} from '../../../i18n'
import {Preview} from '../../../preview'
import {useScheduleDraftOperationsWithToasts} from '../../hooks/useScheduleDraftOperationsWithToasts'
import {useBundleDocuments} from '../../tool/detail/useBundleDocuments'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'

interface DeleteScheduledDraftDialogProps {
  onClose: () => void
  release: ReleaseDocument
  documentType?: string
}

/**
 * @internal
 */
export function DeleteScheduledDraftDialog(
  props: DeleteScheduledDraftDialogProps,
): React.JSX.Element {
  const {onClose, release, documentType} = props
  const {t} = useTranslation()
  const schema = useSchema()
  const [isDeleting, setIsDeleting] = useState(false)

  const scheduledDraftTitle = release.metadata.title || 'Untitled release'

  const releaseId = getReleaseIdFromReleaseDocumentId(release._id)
  const {results: documents} = useBundleDocuments(releaseId || '')
  const firstDocument = documents?.[0]?.document
  const schemaType = documentType ? schema.get(documentType) : null

  const {deleteScheduledDraft} = useScheduleDraftOperationsWithToasts(scheduledDraftTitle)

  const handleDeleteSchedule = useCallback(async () => {
    setIsDeleting(true)
    try {
      await deleteScheduledDraft(release._id, release.state)
    } catch (error) {
      // Error toast handled by useScheduleDraftOperationsWithToasts
    } finally {
      setIsDeleting(false)
      onClose()
    }
  }, [release._id, release.state, deleteScheduledDraft, onClose])

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
      </Stack>
    </Dialog>
  )
}
