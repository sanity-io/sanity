import {ArrowRightIcon} from '@sanity/icons'
import {Box, Button, Dialog, Flex} from '@sanity/ui'
import {type FormEvent, useCallback, useState} from 'react'

import {type BundleDocument} from '../../../store/bundles/types'
import {useBundleOperations} from '../../../store/bundles/useBundleOperations'
import {usePerspective} from '../../hooks/usePerspective'
import {isDraftOrPublished} from '../../util/dummyGetters'
import {BundleForm} from './BundleForm'

interface CreateBundleDialogProps {
  onCancel: () => void
  onCreate: () => void
}

export function CreateBundleDialog(props: CreateBundleDialogProps): JSX.Element {
  const {onCancel, onCreate} = props
  const {createBundle} = useBundleOperations()

  const [value, setValue] = useState<Partial<BundleDocument>>({
    name: '',
    title: '',
    hue: 'gray',
    icon: 'cube',
    publishAt: undefined,
  })
  const [isCreating, setIsCreating] = useState(false)

  // TODO MAKE SURE THIS IS HOW WE WANT TO DO THIS
  const {setPerspective} = usePerspective()

  const handleOnSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      if (value.name) {
        try {
          event.preventDefault()
          setIsCreating(true)
          await createBundle(value)
          setValue(value)
        } catch (err) {
          console.error(err)
        } finally {
          setIsCreating(false)
          setPerspective(value.name)
          onCreate()
        }
      }
    },
    [createBundle, value, setPerspective, onCreate],
  )

  const handleOnChange = useCallback((changedValue: Partial<BundleDocument>) => {
    setValue(changedValue)
  }, [])

  return (
    <Dialog
      animate
      header="Create release"
      id="create-bundle-dialog"
      onClose={onCancel}
      zOffset={5000}
      width={1}
    >
      <form onSubmit={handleOnSubmit}>
        <Box padding={6}>
          <BundleForm onChange={handleOnChange} value={value} />
        </Box>
        <Flex justify="flex-end" padding={3}>
          <Button
            disabled={!value.title || isDraftOrPublished(value.title) || isCreating}
            iconRight={ArrowRightIcon}
            type="submit"
            // localize Text
            text="Create release"
            loading={isCreating}
          />
        </Flex>
      </form>
    </Dialog>
  )
}
