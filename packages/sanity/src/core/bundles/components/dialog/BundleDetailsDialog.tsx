import {ArrowRightIcon} from '@sanity/icons'
import {Box, Flex, useToast} from '@sanity/ui'
import {type FormEvent, useCallback, useState} from 'react'
import {useTranslation} from 'sanity'

import {Button, Dialog} from '../../../../ui-components'
import {type BundleDocument} from '../../../store/bundles/types'
import {useBundleOperations} from '../../../store/bundles/useBundleOperations'
import {usePerspective} from '../../hooks/usePerspective'
import {BundleForm, DEFAULT_BUNDLE} from './BundleForm'

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

  const [value, setValue] = useState<Partial<BundleDocument>>(() => {
    if (bundle) {
      return {
        slug: bundle.slug,
        title: bundle.title,
        description: bundle.description,
        hue: bundle.hue,
        icon: bundle.icon,
      }
    }

    return DEFAULT_BUNDLE
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // TODO MAKE SURE THIS IS HOW WE WANT TO DO THIS
  const {setPerspective} = usePerspective()

  const bundleOperation = useCallback(
    (formValue: Partial<BundleDocument>) => {
      if (formAction === 'edit' && bundle?._id) {
        const updatedBundle: Partial<BundleDocument> = {
          ...formValue,
          _id: bundle._id,
        }

        return updateBundle(updatedBundle)
      }
      return createBundle(formValue)
    },
    [bundle?._id, createBundle, formAction, updateBundle],
  )

  const handleOnSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      if (value.slug) {
        try {
          event.preventDefault()
          setIsSubmitting(true)

          const submitValue = {...value, title: value.title?.trim()}
          await bundleOperation(submitValue)
          if (formAction === 'create') {
            setPerspective(value.slug)
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
      }
    },
    [bundleOperation, formAction, onSubmit, setPerspective, value, toast],
  )

  const handleOnChange = useCallback((changedValue: Partial<BundleDocument>) => {
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
