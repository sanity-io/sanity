import {type EditableReleaseDocument} from '@sanity/client'
import {useTelemetry} from '@sanity/telemetry/react'
import {Box, Card, Flex, useToast} from '@sanity/ui'
import {type FormEvent, useCallback, useState} from 'react'

import {Button} from '../../../../ui-components/button/Button'
import {Dialog} from '../../../../ui-components/dialog/Dialog'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {useSetPerspective} from '../../../perspective/useSetPerspective'
import {CreatedRelease, type OriginInfo} from '../../__telemetry__/releases.telemetry'
import {useCreateReleaseMetadata} from '../../hooks/useCreateReleaseMetadata'
import {useGuardWithReleaseLimitUpsell} from '../../hooks/useGuardWithReleaseLimitUpsell'
import {useReleaseFormStorage} from '../../hooks/useReleaseFormStorage'
import {isReleaseLimitError} from '../../store/isReleaseLimitError'
import {useReleaseOperations} from '../../store/useReleaseOperations'
import {getIsReleaseInvalid} from '../../util/getIsReleaseInvalid'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'
import {getReleaseDefaults} from '../../util/util'
import {ReleaseForm} from './ReleaseForm'

interface CreateReleaseDialogProps {
  onCancel: () => void
  onSubmit: (createdReleaseId: string) => void
  origin?: OriginInfo['origin']
}

export function CreateReleaseDialog(props: CreateReleaseDialogProps): React.JSX.Element {
  const {onCancel, onSubmit, origin} = props
  const toast = useToast()
  const {createRelease} = useReleaseOperations()
  const setPerspective = useSetPerspective()
  const {t} = useTranslation()
  const telemetry = useTelemetry()
  const createReleaseMetadata = useCreateReleaseMetadata()
  const {clearReleaseDataFromStorage} = useReleaseFormStorage()

  const [release, setRelease] = useState(getReleaseDefaults)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const invalid = getIsReleaseInvalid(release)

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

        await createRelease(releaseValue)
        telemetry.log(CreatedRelease, {origin})

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
      telemetry,
      origin,
      setPerspective,
      onSubmit,
      onCancel,
      toast,
      t,
      clearReleaseDataFromStorage,
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
      <Card padding={4} borderTop>
        <form onSubmit={handleOnSubmit}>
          <Box paddingBottom={4}>
            <ReleaseForm onChange={handleOnChange} value={release} />
          </Box>
          <Flex justify="flex-end" paddingTop={5}>
            <Button
              size="large"
              disabled={isSubmitting || invalid}
              type="submit"
              text={dialogConfirm}
              loading={isSubmitting}
              data-testid="submit-release-button"
            />
          </Flex>
        </form>
      </Card>
    </Dialog>
  )
}
