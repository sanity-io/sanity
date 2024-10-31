import {ArrowRightIcon} from '@sanity/icons'
import {useTelemetry} from '@sanity/telemetry/react'
import {Box, Flex, useToast} from '@sanity/ui'
import {type FormEvent, useCallback, useState} from 'react'

import {Button, Dialog} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {type EditableReleaseDocument, type ReleaseDocument} from '../../../store/release/types'
import {useReleaseOperations} from '../../../store/release/useReleaseOperations'
import {
  CreatedRelease,
  type OriginInfo,
  UpdatedRelease,
} from '../../__telemetry__/releases.telemetry'
import {DEFAULT_RELEASE_TYPE} from '../../util/const'
import {createReleaseId} from '../../util/createReleaseId'
import {ReleaseForm} from './ReleaseForm'

interface ReleaseDetailsDialogProps {
  onCancel: () => void
  onSubmit: () => void
  release?: ReleaseDocument
  origin?: OriginInfo['origin']
}

export function ReleaseDetailsDialog(props: ReleaseDetailsDialogProps): JSX.Element {
  const {onCancel, onSubmit, release, origin} = props
  const toast = useToast()
  const {createRelease, updateRelease} = useReleaseOperations()
  const formAction = release ? 'edit' : 'create'
  const {t} = useTranslation()
  const telemetry = useTelemetry()

  const [value, setValue] = useState((): EditableReleaseDocument => {
    return {
      _id: release?._id || createReleaseId(),
      metadata: {
        title: release?.metadata.title,
        description: release?.metadata.description,
        intendedPublishAt: release?.metadata?.intendedPublishAt,
        releaseType: release?.metadata.releaseType || DEFAULT_RELEASE_TYPE,
      },
    } as const
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleOnSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      try {
        event.preventDefault()
        setIsSubmitting(true)

        const submitValue = {
          ...value,
          metadata: {...value.metadata, title: value.metadata?.title?.trim()},
        }
        const action = formAction === 'edit' ? updateRelease : createRelease
        await action(submitValue)
        if (formAction === 'create') {
          telemetry.log(CreatedRelease, {origin})
        } else {
          telemetry.log(UpdatedRelease)
        }
      } catch (err) {
        console.error(err)
        toast.push({
          closable: true,
          status: 'error',
          title: `Failed to ${formAction} release`,
        })
      } finally {
        setIsSubmitting(false)
        onSubmit()
      }
    },
    [value, formAction, updateRelease, createRelease, telemetry, origin, toast, onSubmit],
  )

  const handleOnChange = useCallback((changedValue: EditableReleaseDocument) => {
    setValue(changedValue)
  }, [])

  const dialogTitle = t('release.dialog.create.title')

  const isReleaseScheduled =
    release && (release.state === 'scheduled' || release.state === 'scheduling')

  return (
    <Dialog header={dialogTitle} id="create-release-dialog" onClose={onCancel} width={1}>
      <form onSubmit={handleOnSubmit}>
        <Box paddingX={4} paddingBottom={4}>
          <ReleaseForm
            onChange={handleOnChange}
            value={value}
            isReleaseScheduled={isReleaseScheduled}
          />
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
