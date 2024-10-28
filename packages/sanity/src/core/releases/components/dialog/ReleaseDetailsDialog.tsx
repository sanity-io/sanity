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
import {usePerspective} from '../../hooks/usePerspective'
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
        hue: release?.metadata.hue || 'gray',
        icon: release?.metadata.icon || 'cube',
        intendedPublishAt: release?.metadata?.intendedPublishAt,
        releaseType: release?.metadata.releaseType || DEFAULT_RELEASE_TYPE,
      },
    } as const
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // TODO MAKE SURE THIS IS HOW WE WANT TO DO THIS
  const {setPerspective} = usePerspective()

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
          setPerspective(value._id)
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
    [
      value,
      formAction,
      updateRelease,
      createRelease,
      setPerspective,
      telemetry,
      origin,
      toast,
      onSubmit,
    ],
  )

  const handleOnChange = useCallback((changedValue: EditableReleaseDocument) => {
    setValue(changedValue)
  }, [])

  const dialogTitle =
    formAction === 'edit' ? t('release.dialog.edit.title') : t('release.dialog.create.title')

  return (
    <Dialog header={dialogTitle} id="create-release-dialog" onClose={onCancel} width={1}>
      <form onSubmit={handleOnSubmit}>
        <Box padding={4}>
          <ReleaseForm onChange={handleOnChange} value={value} />
        </Box>
        <Flex justify="flex-end" paddingTop={5}>
          <Button
            size="large"
            disabled={!value.metadata?.title?.trim() || isSubmitting}
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
