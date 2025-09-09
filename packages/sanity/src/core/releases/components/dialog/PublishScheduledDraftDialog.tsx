import {type ReleaseDocument} from '@sanity/client'
import {Box, Stack, Text} from '@sanity/ui'
import {useCallback, useState} from 'react'

import {Dialog} from '../../../../ui-components'
import {LoadingBlock} from '../../../components'
import {useSchema} from '../../../hooks'
import {useTranslation} from '../../../i18n'
import {Preview} from '../../../preview'
import {useScheduledDraftDocument} from '../../hooks/useScheduledDraftDocument'
import {useScheduleDraftOperationsWithToasts} from '../../hooks/useScheduleDraftOperationsWithToasts'

interface PublishScheduledDraftDialogProps {
  onClose: () => void
  release: ReleaseDocument
  documentType?: string
}

/**
 * @internal
 */
export function PublishScheduledDraftDialog(
  props: PublishScheduledDraftDialogProps,
): React.JSX.Element {
  const {onClose, release, documentType} = props
  const {t} = useTranslation()
  const schema = useSchema()
  const [isPublishing, setIsPublishing] = useState(false)

  const scheduledDraftTitle = release.metadata.title || 'Untitled release'

  const {firstDocument} = useScheduledDraftDocument(release._id)
  const schemaType = documentType ? schema.get(documentType) : null

  const {publishScheduledDraft} = useScheduleDraftOperationsWithToasts(scheduledDraftTitle)

  const handlePublishScheduledDraft = useCallback(async () => {
    setIsPublishing(true)
    try {
      await publishScheduledDraft(release._id)
    } catch (error) {
      // Error toast handled by useScheduleDraftOperationsWithToasts
    } finally {
      setIsPublishing(false)
      onClose()
    }
  }, [release._id, publishScheduledDraft, onClose])

  return (
    <Dialog
      id="publish-scheduled-draft-dialog"
      data-testid="publish-scheduled-draft-dialog"
      header={t('release.dialog.publish-scheduled-draft.header')}
      onClose={onClose}
      width={0}
      padding={false}
      footer={{
        cancelButton: {
          disabled: isPublishing,
          onClick: onClose,
        },
        confirmButton: {
          text: t('release.dialog.publish-scheduled-draft.confirm'),
          tone: 'primary',
          onClick: handlePublishScheduledDraft,
          disabled: isPublishing,
          loading: isPublishing,
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
            {t('release.dialog.publish-scheduled-draft.body')}
          </Text>
        </Box>
      </Stack>
    </Dialog>
  )
}
