import {type EditableReleaseDocument} from '@sanity/client'
import {useTelemetry} from '@sanity/telemetry/react'
import {Box, Card, Flex, useToast} from '@sanity/ui'
import {type FormEvent, useCallback, useMemo, useState} from 'react'

import {Button, Dialog} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {useSetPerspective} from '../../../perspective/useSetPerspective'
import {CreatedRelease, type OriginInfo} from '../../__telemetry__/releases.telemetry'
import {useCreateReleaseMetadata} from '../../hooks/useCreateReleaseMetadata'
import {useGuardWithReleaseLimitUpsell} from '../../hooks/useGuardWithReleaseLimitUpsell'
import {useReleaseFormStorage} from '../../hooks/useReleaseFormStorage'
import {isReleaseLimitError} from '../../store/isReleaseLimitError'
import {useReleaseOperations} from '../../store/useReleaseOperations'
import {useReleaseTemplateOperations} from '../../tool/overview/templates'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'
import {getReleaseDefaults} from '../../util/util'
import {ReleaseDocumentPreview} from './ReleaseDocumentPreview'
import {ReleaseForm} from './ReleaseForm'

interface CreateReleaseDialogProps {
  onCancel: () => void
  onSubmit: (createdReleaseId: string) => void
  origin?: OriginInfo['origin']
  initialValues?: EditableReleaseDocument & {selectedDocumentTypes?: string[]}
  templateId?: string
}

export function CreateReleaseDialog(props: CreateReleaseDialogProps): React.JSX.Element {
  const {onCancel, onSubmit, origin, initialValues, templateId} = props
  const toast = useToast()
  const {createRelease, createReleaseFromTemplate} = useReleaseOperations()
  const {incrementUsage} = useReleaseTemplateOperations()
  const setPerspective = useSetPerspective()
  const {t} = useTranslation()
  const telemetry = useTelemetry()
  const createReleaseMetadata = useCreateReleaseMetadata()
  const {clearReleaseDataFromStorage} = useReleaseFormStorage()

  const [release, setRelease] = useState(() => initialValues || getReleaseDefaults())
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Extract selected document types from initial values if present
  const selectedDocumentTypes = useMemo(
    () => initialValues?.selectedDocumentTypes || [],
    [initialValues?.selectedDocumentTypes],
  )

  const {releasePromise} = useGuardWithReleaseLimitUpsell()

  const handleOnSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      setIsSubmitting(true)
      const inQuota = await releasePromise

      if (!inQuota) {
        setIsSubmitting(false)
        return
      }

      try {
        const releaseValue = createReleaseMetadata(release)

        // Use createReleaseFromTemplate if we have selected document types from a template
        if (selectedDocumentTypes.length > 0) {
          await createReleaseFromTemplate(releaseValue, selectedDocumentTypes)
        } else {
          await createRelease(releaseValue)
        }

        telemetry.log(CreatedRelease, {origin})

        // Increment template usage if this release was created from a template (non-blocking)
        if (templateId) {
          incrementUsage(templateId).catch((err) => {
            // Log error but don't affect the user flow
            console.error('Failed to increment template usage:', err)
          })
        }

        // TODO: Remove this! temporary fix to give some time for the release to be created and the releases store state updated before closing the dialog.
        await new Promise((resolve) => setTimeout(resolve, 1000))
        // TODO: Remove the upper part

        setPerspective(getReleaseIdFromReleaseDocumentId(release._id))

        onSubmit(getReleaseIdFromReleaseDocumentId(release._id))
      } catch (err) {
        if (isReleaseLimitError(err)) {
          onCancel()
          clearReleaseDataFromStorage()
        } else {
          console.error(err)
          toast.push({
            closable: true,
            status: 'error',
            title: t('release.toast.create-release-error.title'),
          })
        }
      } finally {
        setIsSubmitting(false)
        clearReleaseDataFromStorage()
      }
    },
    [
      releasePromise,
      createReleaseMetadata,
      release,
      createRelease,
      createReleaseFromTemplate,
      selectedDocumentTypes,
      telemetry,
      origin,
      setPerspective,
      onSubmit,
      onCancel,
      toast,
      t,
      clearReleaseDataFromStorage,
      templateId,
      incrementUsage,
    ],
  )

  const handleOnChange = useCallback((releaseMetadata: EditableReleaseDocument) => {
    setRelease(releaseMetadata)
  }, [])

  const dialogTitle = t('release.dialog.create.title')
  const dialogConfirm = t('release.dialog.create.confirm')

  const handleOnClose = useCallback(() => {
    clearReleaseDataFromStorage()
    onCancel()
  }, [clearReleaseDataFromStorage, onCancel])

  return (
    <Dialog
      onClickOutside={onCancel}
      header={dialogTitle}
      id="create-release-dialog"
      onClose={handleOnClose}
      width={1}
      padding={false}
    >
      {/* Show document types that will be created when creating from template */}
      {selectedDocumentTypes.length > 0 && (
        <Box paddingX={2}>
          {selectedDocumentTypes.map((typeName) => (
            <ReleaseDocumentPreview
              key={typeName}
              schemaTypeName={typeName}
              tone="primary"
              title={release.metadata?.title || 'Untitled Release'}
              showDocument
            />
          ))}
        </Box>
      )}

      <Card padding={4} borderTop>
        <form onSubmit={handleOnSubmit}>
          <Box paddingBottom={4}>
            <ReleaseForm
              onChange={handleOnChange}
              value={release}
              hasInitialValues={!!initialValues}
            />
          </Box>

          <Flex justify="flex-end" paddingTop={5}>
            <Button
              size="large"
              type="submit"
              disabled={isSubmitting}
              text={dialogConfirm}
              loading={isSubmitting}
              tone="primary"
            />
          </Flex>
        </form>
      </Card>
    </Dialog>
  )
}
