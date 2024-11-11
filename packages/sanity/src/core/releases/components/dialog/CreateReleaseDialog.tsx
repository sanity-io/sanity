import {ArrowRightIcon} from '@sanity/icons'
import {useTelemetry} from '@sanity/telemetry/react'
import {Box, Flex, useToast} from '@sanity/ui'
import {type FormEvent, useCallback, useState} from 'react'

import {Button, Dialog} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {CreatedRelease, type OriginInfo} from '../../__telemetry__/releases.telemetry'
import {type EditableReleaseDocument} from '../../store/types'
import {useReleaseOperations} from '../../store/useReleaseOperations'
import {DEFAULT_RELEASE_TYPE} from '../../util/const'
import {createReleaseId} from '../../util/createReleaseId'
import {getBundleIdFromReleaseDocumentId} from '../../util/getBundleIdFromReleaseDocumentId'
import {ReleaseForm} from './ReleaseForm'

interface CreateReleaseDialogProps {
  onCancel: () => void
  onSubmit: (createdReleaseId: string) => void
  origin?: OriginInfo['origin']
}

export function CreateReleaseDialog(props: CreateReleaseDialogProps): JSX.Element {
  const {onCancel, onSubmit, origin} = props
  const toast = useToast()
  const {createRelease} = useReleaseOperations()
  const {t} = useTranslation()
  const telemetry = useTelemetry()

  const [value, setValue] = useState((): EditableReleaseDocument => {
    return {
      _id: createReleaseId(),
      metadata: {
        releaseType: DEFAULT_RELEASE_TYPE,
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
        setIsSubmitting(false)
        onSubmit(getBundleIdFromReleaseDocumentId(value._id))
      }
    },
    [value, createRelease, telemetry, origin, toast, onSubmit],
  )

  const handleOnChange = useCallback((changedValue: EditableReleaseDocument) => {
    setValue(changedValue)
  }, [])

  const dialogTitle = t('dialog.create.title')

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
          <ReleaseForm onChange={handleOnChange} value={value} />
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
