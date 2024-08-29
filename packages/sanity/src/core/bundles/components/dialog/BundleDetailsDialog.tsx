import {ArrowRightIcon} from '@sanity/icons'
import {Box, Flex, useToast} from '@sanity/ui'
import {customAlphabet} from 'nanoid'
import {type FormEvent, useCallback, useMemo, useState} from 'react'
import {type FormBundleDocument, useTranslation} from 'sanity'
import speakingurl from 'speakingurl'

import {Button, Dialog} from '../../../../ui-components'
import {type BundleDocument} from '../../../store/bundles/types'
import {useBundleOperations} from '../../../store/bundles/useBundleOperations'
import {usePerspective} from '../../hooks/usePerspective'
import {BundleForm} from './BundleForm'

interface BundleDetailsDialogProps {
  onCancel: () => void
  onSubmit: () => void
  bundle?: BundleDocument
}

/**
 * ~24 years (or 7.54e+8 seconds) needed, in order to have a 1% probability of at least one collision if 10 ID's are generated every hour.
 */
const randomBundleId = customAlphabet(
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  8,
)
function getRandomBundleId() {
  return `r${randomBundleId()}`
}

export function BundleDetailsDialog(props: BundleDetailsDialogProps): JSX.Element {
  const {onCancel, onSubmit, bundle} = props
  const toast = useToast()
  const {createBundle, updateBundle} = useBundleOperations()
  const formAction = bundle ? 'edit' : 'create'
  const {t} = useTranslation()

  const [value, setValue] = useState((): FormBundleDocument => {
    return {
      _id: bundle?._id || getRandomBundleId(),
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

  const slug = useMemo(() => {
    return value.title ? speakingurl(value.title) : undefined
  }, [value.title])

  const handleOnSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      try {
        event.preventDefault()
        setIsSubmitting(true)

        const submitValue = {...value, title: value.title?.trim()}
        await submit(submitValue)
        if (formAction === 'create') {
          setPerspective(`${value._id!}-${slug}`)
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
    [value, submit, formAction, setPerspective, slug, toast, onSubmit],
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
