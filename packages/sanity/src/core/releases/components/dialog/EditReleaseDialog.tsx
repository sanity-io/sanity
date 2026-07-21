import {type EditableReleaseDocument, type ReleaseDocument} from '@sanity/client'
import {Card, Flex, useToast} from '@sanity/ui'
import {useCallback, useState} from 'react'

import {Button, Dialog} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {useReleaseOperations} from '../../store/useReleaseOperations'
import {TitleDescriptionForm} from './TitleDescriptionForm'

/**
 * Explicit edit surface for a release's title + description. The detail page is a read-only display
 * surface; editing is a deliberate action that opens this dialog (the same form used when creating a
 * release), so editing a release — a document — is intentional rather than an accidental inline edit.
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

  const [edited, setEdited] = useState<EditableReleaseDocument>(release)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      await updateRelease(edited)
      onClose()
    } catch (err) {
      console.error(err)
      toast.push({
        closable: true,
        status: 'error',
        title: t('release.toast.edit-release-error.title'),
      })
    } finally {
      setIsSaving(false)
    }
  }, [edited, onClose, t, toast, updateRelease])

  return (
    <Dialog
      header={t('release.dialog.edit.title')}
      id="edit-release-dialog"
      onClickOutside={onClose}
      onClose={onClose}
      padding={false}
      width={1}
    >
      <Card padding={4} borderTop>
        {/* Feed the accumulating `edited` value back in (like the create dialog's controlled value)
            so editing one field then another does not drop the first field's change. */}
        <TitleDescriptionForm release={edited} onChange={setEdited} />
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
