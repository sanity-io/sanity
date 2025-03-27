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
  const toast = useToast()
  const schema = useSchema()
  const operations = useScheduleDraftOperations()
  const [isPublishing, setIsPublishing] = useState(false)

  const {firstDocument, firstDocumentPreview} = useScheduledDraftDocument(release._id, {
    includePreview: true,
  })
  const schemaType = documentType ? schema.get(documentType) : null

  const handlePublishScheduledDraft = useCallback(async () => {
    setIsPublishing(true)
    try {
      await operations.publishScheduledDraft(release)
      toast.push({
        closable: true,
        status: 'success',
        description: (
          <Translate
            t={t}
            i18nKey="release.toast.publish-scheduled-draft.success"
            values={{title: firstDocumentPreview?.title || t('preview.default.title-fallback')}}
          />
        ),
      })
    } catch (error) {
      console.error('Failed to run scheduled draft:', error)
      toast.push({
        closable: true,
        status: 'error',
        description: (
          <Translate
            t={t}
            i18nKey="release.toast.publish-scheduled-draft.error"
            values={{
              title: firstDocumentPreview?.title || t('preview.default.title-fallback'),
              error: getErrorMessage(error),
            }}
          />
        ),
      })
    } finally {
      setIsPublishing(false)
      onClose()
    }
  }, [operations, release, toast, t, firstDocumentPreview?.title, onClose])

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
      <Stack gap={3} paddingX={3} marginBottom={2}>
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
