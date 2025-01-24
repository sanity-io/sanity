import {ArrowRightIcon} from '@sanity/icons'
import {useTelemetry} from '@sanity/telemetry/react'
import {Box, Flex, useToast} from '@sanity/ui'
import {type FormEvent, useCallback, useState} from 'react'

import {Button, Dialog} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {CreatedRelease, type OriginInfo} from '../../__telemetry__/releases.telemetry'
import {releasesLocaleNamespace} from '../../i18n'
import {type EditableReleaseDocument} from '../../store/types'
import {useReleaseOperations} from '../../store/useReleaseOperations'
import {DEFAULT_RELEASE_TYPE} from '../../util/const'
import {createReleaseId} from '../../util/createReleaseId'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'
import {getIsScheduledDateInPast, ReleaseForm} from './ReleaseForm'

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

  const [isScheduledDateInPast, setIsScheduledDateInPast] = useState(() =>
    getIsScheduledDateInPast(release),
  )

  const handleOnSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (isScheduledDateInPast) {
        toast.push({
          closable: true,
          status: 'warning',
          title: tRelease('schedule-dialog.publish-date-in-past-warning'),
        })
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
      } catch (err) {
        console.error(err)
        toast.push({
          closable: true,
          status: 'error',
          title: `Failed to create release`,
        })
      } finally {
        // TODO: Remove this! temporary fix to give some time for the release to be created and the releases store state updated before closing the dialog.
        await new Promise((resolve) => setTimeout(resolve, 1000))
        // TODO: Remove the upper part

        setIsSubmitting(false)
        onSubmit(getReleaseIdFromReleaseDocumentId(release._id))
      }
    },
    [isScheduledDateInPast, toast, tRelease, release, createRelease, telemetry, origin, onSubmit],
  )

  const handleOnChange = useCallback((changedValue: EditableReleaseDocument) => {
    setRelease(changedValue)

    // when the value changes, re-evaluate if the scheduled date is in the past
    setIsScheduledDateInPast(getIsScheduledDateInPast(changedValue))
  }, [])

  const handleOnMouseEnter = () => setIsScheduledDateInPast(getIsScheduledDateInPast(release))

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
            // to handle cases where the dialog is open for some time
            // and so the validity of the date needs to be checked again
            onMouseEnter={handleOnMouseEnter}
            onFocus={handleOnMouseEnter}
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
