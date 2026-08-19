import {type EditableReleaseDocument, type ReleaseDocument} from '@sanity/client'
import {Card, Flex, Stack, Text, TextArea, TextInput} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
import {type ChangeEvent, useCallback, useId, useRef, useState} from 'react'

import {Button} from '../../../../ui-components/button/Button'
import {Dialog} from '../../../../ui-components/dialog/Dialog'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {useReleaseOperations} from '../../store/useReleaseOperations'

/**
 * Explicit edit surface for a release's title + description. The detail page is a read-only display
 * surface; editing is a deliberate action that opens this dialog, so editing a release — a document
 * — is intentional rather than an accidental inline edit.
 *
 * The fields are explicitly labelled ("Title" / "Description") so it reads as a form for changing
 * those properties, not as free-floating text.
 *
 * @internal
 */
export function EditReleaseDialog({
  release,
  onClose,
}: {
  release: ReleaseDocument
  onClose: () => void
}): React.JSX.Element {
  const {updateRelease} = useReleaseOperations()
  const {t} = useTranslation()
  const toast = useToast()
  const titleId = useId()
  const descriptionId = useId()

  const [title, setTitle] = useState(release.metadata.title ?? '')
  const [description, setDescription] = useState(release.metadata.description ?? '')
  const [isSaving, setIsSaving] = useState(false)
  // Synchronous re-entry guard. `loading={isSaving}` only disables the button after a re-render, so
  // two clicks in the same tick would both reach updateRelease. This ref blocks the second call
  // immediately.
  const isSavingRef = useRef(false)

  const handleSave = useCallback(async () => {
    if (isSavingRef.current) return
    isSavingRef.current = true
    setIsSaving(true)
    try {
      const next: EditableReleaseDocument = {
        ...release,
        metadata: {...release.metadata, title, description},
      }
      await updateRelease(next)
      onClose()
    } catch (err) {
      console.error(err)
      toast.push({
        closable: true,
        status: 'error',
        title: t('release.toast.edit-release-error.title'),
      })
      // oxlint-disable-next-line react/todo -- pre-existing violation, to be fixed in a follow-up
    } finally {
      isSavingRef.current = false
      setIsSaving(false)
    }
  }, [description, onClose, release, t, title, toast, updateRelease])

  // Ignore click-outside / Escape / close while a save is in flight: dismissing mid-mutation would
  // unmount the dialog while updateRelease continues, letting the user reopen and edit against a
  // stale in-flight save. The success path calls onClose directly, so it is unaffected.
  const handleClose = useCallback(() => {
    if (isSaving) return
    onClose()
  }, [isSaving, onClose])

  return (
    <Dialog
      header={t('release.dialog.edit.title')}
      id="edit-release-dialog"
      onClickOutside={handleClose}
      onClose={handleClose}
      padding={false}
      width={1}
    >
      <Card padding={4} borderTop>
        <Stack gap={5}>
          <Stack gap={3}>
            <Text as="label" htmlFor={titleId} size={1} weight="medium">
              {t('release.dialog.edit.title-label')}
            </Text>
            <TextInput
              data-testid="release-form-title"
              id={titleId}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setTitle(event.currentTarget.value)
              }
              value={title}
            />
          </Stack>
          <Stack gap={3}>
            <Text as="label" htmlFor={descriptionId} size={1} weight="medium">
              {t('release.dialog.edit.description-label')}
            </Text>
            <TextArea
              data-testid="release-form-description"
              id={descriptionId}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                setDescription(event.currentTarget.value)
              }
              rows={6}
              value={description}
            />
          </Stack>
        </Stack>
        <Flex justify="flex-end" paddingTop={5}>
          <Button
            data-testid="save-release-details-button"
            loading={isSaving}
            onClick={handleSave}
            size="large"
            text={t('release.dialog.edit.confirm')}
          />
        </Flex>
      </Card>
    </Dialog>
  )
}
