import {Box, Checkbox, Flex, Label, Stack, Text, TextArea} from '@sanity/ui'
import {type ChangeEvent, useCallback, useState} from 'react'

import {Button} from '../../../../ui-components'
import {Dialog} from '../../../../ui-components/dialog'
import {useTranslation} from '../../../i18n'
import {useCurrentUser} from '../../../store'
import {useWorkspace} from '../../workspace'
import {setJamMetadata} from './jamMetadata'
import {useJamRecorder} from './useJamRecorder'

/** @internal */
export interface FeedbackDialogProps {
  header: string
  recordingId: string
  /** Additional metadata to attach to the Jam recording (e.g. documentId, documentType). */
  metadata?: Record<string, unknown>
  onClose: () => void
}

/** @internal */
export function FeedbackDialog({header, recordingId, metadata, onClose}: FeedbackDialogProps) {
  const [description, setDescription] = useState('')
  const [contactOk, setContactOk] = useState(false)
  const {t} = useTranslation()
  const user = useCurrentUser()
  const workspace = useWorkspace()
  const {openRecorder} = useJamRecorder()

  const handleSubmit = useCallback(async () => {
    const jamData = {
      contactAllowed: contactOk,
      dataset: workspace.dataset,
      description,
      projectId: workspace.projectId,
      reporter: user?.email,
      reporterName: user?.name,
      workspace: workspace.name,
      ...metadata,
    }

    // eslint-disable-next-line no-console
    console.log('[FeedbackDialog] Jam metadata:', jamData)
    setJamMetadata(jamData)

    await openRecorder(recordingId)
    onClose()
  }, [contactOk, description, metadata, onClose, openRecorder, recordingId, user, workspace])

  const handleDescriptionChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.currentTarget.value)
  }, [])

  const handleContactChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setContactOk(e.currentTarget.checked)
  }, [])

  return (
    <Dialog header={header} id="feedback-dialog" onClose={onClose} width={1}>
      <Stack space={4}>
        <Stack space={2}>
          <Label size={1} htmlFor="feedback-description">
            {t('feedback.dialog.description-label')}
          </Label>
          <TextArea
            id="feedback-description"
            value={description}
            onChange={handleDescriptionChange}
            rows={3}
          />
        </Stack>

        <Flex align="center" as="label" gap={2}>
          <Checkbox checked={contactOk} onChange={handleContactChange} />
          <Box flex={1}>
            <Text size={1} muted>
              {t('feedback.dialog.contact-consent')}
            </Text>
          </Box>
        </Flex>

        <Button text={t('feedback.dialog.submit')} tone="primary" onClick={handleSubmit} />
      </Stack>
    </Dialog>
  )
}
