import {ArrowRightIcon} from '@sanity/icons'
import {useTelemetry} from '@sanity/telemetry/react'
import {Box, Flex, useToast} from '@sanity/ui'
import {type FormEvent, useCallback, useState} from 'react'

import {Button, Dialog} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {CreatedRelease, type OriginInfo} from '../../__telemetry__/releases.telemetry'
import {useCreateReleaseMetadata} from '../../hooks/useCreateReleaseMetadata'
import {isReleaseLimitError} from '../../store/isReleaseLimitError'
import {type EditableReleaseDocument} from '../../store/types'
import {useReleaseOperations} from '../../store/useReleaseOperations'
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
  const {t} = useTranslation()
  const telemetry = useTelemetry()
  const createReleaseMetadata = useCreateReleaseMetadata()

  const [release, setRelease] = useState(getReleaseDefaults)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleOnSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      try {
        setIsSubmitting(true)

        const releaseValue = createReleaseMetadata(release)

        await createRelease(releaseValue)
        telemetry.log(CreatedRelease, {origin})

        // TODO: Remove this! temporary fix to give some time for the release to be created and the releases store state updated before closing the dialog.
        await new Promise((resolve) => setTimeout(resolve, 1000))
        // TODO: Remove the upper part

        onSubmit(getReleaseIdFromReleaseDocumentId(release._id))
      } catch (err) {
        if (isReleaseLimitError(err)) {
          onCancel()
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
      }
    },
    [
      release,
      toast,
      createReleaseMetadata,
      createRelease,
      telemetry,
      origin,
      onSubmit,
      onCancel,
      t,
    ],
  )

  const handleOnChange = useCallback((releaseMetadata: EditableReleaseDocument) => {
    setRelease(releaseMetadata)
  }, [])

  const dialogTitle = t('release.dialog.create.title')

  return (
    <Dialog
      onClickOutside={onCancel}
      header={dialogTitle}
      id="create-release-dialog"
      onClose={onCancel}
      width={1}
    >
      <form onSubmit={handleOnSubmit}>
        <Box paddingX={4} paddingBottom={4}>
          <ReleaseForm onChange={handleOnChange} value={release} />
        </Box>
        <Flex justify="flex-end" paddingTop={5}>
          <Button
            size="large"
            disabled={isSubmitting}
            iconRight={ArrowRightIcon}
            type="submit"
            text={dialogTitle}
            loading={isSubmitting}
            data-testid="submit-release-button"
          />
        </Flex>
      </form>
    </Dialog>
  )
}
