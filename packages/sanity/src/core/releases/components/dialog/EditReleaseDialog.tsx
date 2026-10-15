import {type EditableReleaseDocument, type ReleaseDocument} from '@sanity/client'
import {Card, TextArea, TextInput} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
import {type ChangeEvent, useCallback, useId, useRef, useState} from 'react'
import {Text, Flex, VStack} from 'ui5'

import {Button} from '../../../../ui-components/button/Button'
import {Dialog} from '../../../../ui-components/dialog/Dialog'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {useWorkspace} from '../../../studio/workspace'
import {
  asReleaseMetadata,
  toReleaseMetadataRecord,
  type ReleaseMetadataRecord,
} from '../../metadata/mergeReleaseMetadata'
import {useReleaseOperations} from '../../store/useReleaseOperations'
import {useCanEditRelease} from '../../tool/detail/useCanEditRelease'
import {ReleaseMetadataForm} from './ReleaseMetadataForm'

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
  const hasMetadataFields = (useWorkspace().releases?.metadata?.fields?.length ?? 0) > 0
  const canEdit = useCanEditRelease(release)

  const [metadata, setMetadata] = useState<ReleaseMetadataRecord>(() =>
    toReleaseMetadataRecord(release.metadata),
  )
  const [metadataValid, setMetadataValid] = useState(!hasMetadataFields)
  const [isSaving, setIsSaving] = useState(false)
  // Synchronous re-entry guard. `loading={isSaving}` only disables the button after a re-render, so
  // two clicks in the same tick would both reach updateRelease. This ref blocks the second call
  // immediately.
  const isSavingRef = useRef(false)

  const handleMetadataChange = useCallback((next: EditableReleaseDocument['metadata']) => {
    setMetadata(toReleaseMetadataRecord(next))
  }, [])

  const handleSave = useCallback(async () => {
    if (isSavingRef.current || !metadataValid || !canEdit) return
    isSavingRef.current = true
    setIsSaving(true)
    try {
      const next: EditableReleaseDocument = {
        ...release,
        metadata: asReleaseMetadata(metadata),
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
    }
    isSavingRef.current = false
    setIsSaving(false)
  }, [canEdit, metadata, metadataValid, onClose, release, t, toast, updateRelease])

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
        <VStack gap={5}>
          <VStack gap={3}>
            <Text as="label" htmlFor={titleId} size={1} weight="medium" trim={true}>
              {t('release.dialog.edit.title-label')}
            </Text>
            <TextInput
              data-testid="release-form-title"
              id={titleId}
              readOnly={!canEdit}
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                const title = event.currentTarget.value
                setMetadata((current) => ({...current, title}))
              }}
              value={typeof metadata.title === 'string' ? metadata.title : ''}
            />
          </VStack>
          <VStack gap={3}>
            <Text as="label" htmlFor={descriptionId} size={1} weight="medium" trim={true}>
              {t('release.dialog.edit.description-label')}
            </Text>
            <TextArea
              data-testid="release-form-description"
              id={descriptionId}
              readOnly={!canEdit}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
                const description = event.currentTarget.value
                setMetadata((current) => ({...current, description}))
              }}
              rows={6}
              value={typeof metadata.description === 'string' ? metadata.description : ''}
            />
          </VStack>
          <ReleaseMetadataForm
            metadata={asReleaseMetadata(metadata)}
            onChange={handleMetadataChange}
            onValidityChange={setMetadataValid}
            readOnly={!canEdit}
          />
        </VStack>
        <Flex justifyContent="flex-end" paddingTop={5}>
          <Button
            data-testid="save-release-details-button"
            disabled={!metadataValid || !canEdit}
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
