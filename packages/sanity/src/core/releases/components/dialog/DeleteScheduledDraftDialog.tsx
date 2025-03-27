import {type ReleaseDocument} from '@sanity/client'
import {Box, Stack, Text, useToast} from '@sanity/ui'
import {useCallback, useState} from 'react'

import {Dialog} from '../../../../ui-components'
import {LoadingBlock} from '../../../components'
import {useSchema} from '../../../hooks'
import {Translate, useTranslation} from '../../../i18n'
import {Preview} from '../../../preview'
import {getErrorMessage} from '../../../util'
import {useScheduledDraftDocument} from '../../hooks/useScheduledDraftDocument'
import {useScheduleDraftOperations} from '../../hooks/useScheduleDraftOperations'

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
  const toast = useToast()
  const schema = useSchema()
  const operations = useScheduleDraftOperations()
  const [isDeleting, setIsDeleting] = useState(false)

  const {firstDocument, firstDocumentPreview} = useScheduledDraftDocument(release._id, {
    includePreview: true,
  })
  const schemaType = documentType ? schema.get(documentType) : null

  const handleDeleteSchedule = useCallback(async () => {
    setIsDeleting(true)
    try {
      await operations.deleteScheduledDraft(release._id)
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
      setIsDeleting(false)
      onClose()
    }
  }, [release._id, operations, toast, t, firstDocumentPreview?.title, onClose])

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
      <Stack gap={3} paddingX={3} marginBottom={2}>
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
