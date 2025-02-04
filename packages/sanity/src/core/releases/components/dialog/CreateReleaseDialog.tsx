import {ArrowRightIcon} from '@sanity/icons'
import {useTelemetry} from '@sanity/telemetry/react'
import {Box, Flex, useToast} from '@sanity/ui'
import {type FormEvent, useCallback, useState} from 'react'

import {Button, Dialog} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {CreatedRelease, type OriginInfo} from '../../__telemetry__/releases.telemetry'
import {releasesLocaleNamespace} from '../../i18n'
import {isReleaseLimitError} from '../../store/isReleaseLimitError'
import {type EditableReleaseDocument} from '../../store/types'
import {useReleaseOperations} from '../../store/useReleaseOperations'
import {DEFAULT_RELEASE_TYPE} from '../../util/const'
import {createReleaseId} from '../../util/createReleaseId'
import {getIsScheduledDateInPast} from '../../util/getIsScheduledDateInPast'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'
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
  const {t: tRelease} = useTranslation(releasesLocaleNamespace)
  const telemetry = useTelemetry()

  const [release, setRelease] = useState((): EditableReleaseDocument => {
    return {
      _id: createReleaseId(),
      metadata: {
        title: '',
        description: '',
        releaseType: DEFAULT_RELEASE_TYPE,
      },
    } as const
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  /**
   * This state supports the scenario of:
   * release.intendedPublishAt is set to a valid future date; but at time of submit it is in the past
   * Without an update on this state, CreateReleaseDialog would not rerender
   * and so date in past warning ui elements wouldn't show
   */
  const [, setRerenderDialog] = useState(0)

  const isScheduledDateInPast = getIsScheduledDateInPast(release)

  const handleOnSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      // re-evaluate if date is in past
      // as dialog could have been left idle for a while
      if (getIsScheduledDateInPast(release)) {
        toast.push({
          closable: true,
          status: 'warning',
          title: tRelease('schedule-dialog.publish-date-in-past-warning'),
        })
        setRerenderDialog((cur) => cur + 1)
        return // do not submit if date is in past
      }

      try {
        setIsSubmitting(true)

        const submitValue = {
          ...release,
          metadata: {...release.metadata, title: release.metadata?.title?.trim()},
        }
        await createRelease(submitValue)
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
    [release, toast, tRelease, createRelease, telemetry, origin, onCancel, t, onSubmit],
  )

  const handleOnChange = useCallback((changedValue: EditableReleaseDocument) => {
    setRelease(changedValue)
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
            tooltipProps={{
              disabled: !isScheduledDateInPast,
              content: tRelease('schedule-dialog.publish-date-in-past-warning'),
            }}
            size="large"
            disabled={isSubmitting || isScheduledDateInPast}
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
