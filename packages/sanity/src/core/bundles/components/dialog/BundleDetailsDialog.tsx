import {ArrowRightIcon} from '@sanity/icons'
import {useTelemetry} from '@sanity/telemetry/react'
import {Box, Flex, useToast} from '@sanity/ui'
import {type FormEvent, useCallback, useState} from 'react'
import {type FormBundleDocument, useTranslation} from 'sanity'

import {Button, Dialog} from '../../../../ui-components'
import {type BundleDocument} from '../../../store/bundles/types'
import {useBundleOperations} from '../../../store/bundles/useBundleOperations'
import {CreatedRelease, UpdatedRelease} from '../../__telemetry__/releases.telemetry'
import {usePerspective} from '../../hooks/usePerspective'
import {createReleaseId} from '../../util/createReleaseId'
import {BundleForm} from './BundleForm'

interface BundleDetailsDialogProps {
  onCancel: () => void
  onSubmit: () => void
  bundle?: BundleDocument
}

export function BundleDetailsDialog(props: BundleDetailsDialogProps): JSX.Element {
  const {onCancel, onSubmit, bundle} = props
  const toast = useToast()
  const {createBundle, updateBundle} = useBundleOperations()
  const formAction = bundle ? 'edit' : 'create'
  const {t} = useTranslation()
  const telemetry = useTelemetry()

  const [value, setValue] = useState((): FormBundleDocument => {
    return {
      _id: bundle?._id || createReleaseId(),
      _type: 'release',
      title: bundle?.title,
      description: bundle?.description,
      hue: bundle?.hue || 'gray',
      icon: bundle?.icon || 'cube',
      publishedAt: bundle?.publishedAt,
    } as const
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // TODO MAKE SURE THIS IS HOW WE WANT TO DO THIS
  const {setPerspective} = usePerspective()

  const submit = useCallback(
    (formValue: FormBundleDocument) => {
      return formAction === 'edit' ? updateBundle(formValue) : createBundle(formValue)
    },
    [createBundle, formAction, updateBundle],
  )

  const handleOnSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      try {
        event.preventDefault()
        setIsSubmitting(true)

        const submitValue = {...value, title: value.title?.trim()}
        await submit(submitValue)
        if (formAction === 'create') {
          setPerspective(value._id)
          telemetry.log(CreatedRelease)
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
    [value, submit, formAction, setPerspective, telemetry, toast, onSubmit],
  )

  const handleOnChange = useCallback((changedValue: FormBundleDocument) => {
    setValue(changedValue)
  }, [])

  const dialogTitle =
    formAction === 'edit' ? t('bundle.dialog.edit.title') : t('bundle.dialog.create.title')

  return (
    <Dialog header={dialogTitle} id="create-bundle-dialog" onClose={onCancel} width={1}>
      <form onSubmit={handleOnSubmit}>
        <Box padding={4}>
          <BundleForm onChange={handleOnChange} value={value} />
        </Box>
        <Flex justify="flex-end" paddingTop={5}>
          <Button
            size="large"
            disabled={!value.title?.trim() || isSubmitting}
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
