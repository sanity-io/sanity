import {ArrowRightIcon} from '@sanity/icons'
import {Box, Button, Dialog, Flex, useToast} from '@sanity/ui'
import {type FormEvent, useCallback, useState} from 'react'

import {type BundleDocument} from '../../../store/bundles/types'
import {useBundleOperations} from '../../../store/bundles/useBundleOperations'
import {usePerspective} from '../../hooks/usePerspective'
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
  const [hasErrors, setHasErrors] = useState(false)
  const formAction = bundle ? 'edit' : 'create'

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

    return {
      slug: '',
      title: '',
      hue: 'gray',
      icon: 'cube',
      //publishAt: undefined,
    }
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
          await bundleOperation(value)
          setValue(value)
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

  const handleOnError = useCallback((errorsExist: boolean) => {
    setHasErrors(errorsExist)
  }, [])

  const dialogTitle = formAction === 'edit' ? 'Edit release' : 'Create release'

  return (
    <Dialog
      animate
      header={dialogTitle}
      id="create-bundle-dialog"
      onClose={onCancel}
      zOffset={5000}
      width={1}
    >
      <form onSubmit={handleOnSubmit}>
        <Box padding={6}>
          <BundleForm onChange={handleOnChange} onError={handleOnError} value={value} />
        </Box>
        <Flex justify="flex-end" padding={3}>
          <Button
            disabled={!value.title || isSubmitting || hasErrors}
            iconRight={ArrowRightIcon}
            type="submit"
            // localize Text
            text={dialogTitle}
            loading={isSubmitting}
            data-testid="submit-release-button"
          />
        </Flex>
      </form>
    </Dialog>
  )
}
