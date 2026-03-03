import {useTelemetry} from '@sanity/telemetry/react'
import {Box, Card, Flex, useToast} from '@sanity/ui'
import {type FormEvent, useCallback, useState} from 'react'

import {Button, Dialog} from '../../../../ui-components'
import {RELEASE_PTE_DESCRIPTION} from '../../../config/types'
import {useTranslation} from '../../../i18n'
import {useSetPerspective} from '../../../perspective/useSetPerspective'
import {useWorkspace} from '../../../studio/workspace'
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
  const workspace = useWorkspace()
  const isPTE = workspace.releases?.[RELEASE_PTE_DESCRIPTION] ?? false

  const [release, setRelease] = useState(() => getReleaseDefaults({pteDescription: isPTE}))
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
        // Close the dialog after creating the release.
        onCancel()
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
      }
      setIsSubmitting(false)
      clearReleaseDataFromStorage()
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

  const handleOnClose = useCallback(() => {
    clearReleaseDataFromStorage()
    onCancel()
  }, [clearReleaseDataFromStorage, onCancel])

  return (
    <Dialog
      onClickOutside={onCancel}
      header={t('release.dialog.create.title')}
      id="create-release-dialog"
      onClose={handleOnClose}
      width={1}
      padding={false}
    >
      <Card padding={4} borderTop>
        <form onSubmit={handleOnSubmit}>
          <Box paddingBottom={4}>
            <ReleaseForm onChange={setRelease} value={release} />
          </Box>
          <Flex justify="flex-end" paddingTop={5}>
            <Button
              size="large"
              disabled={isSubmitting || invalid}
              type="submit"
              text={t('release.dialog.create.confirm')}
              loading={isSubmitting}
              data-testid="submit-release-button"
            />
          </Flex>
        </form>
      </Card>
    </Dialog>
  )
}
