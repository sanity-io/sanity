import {ArrowRightIcon} from '@sanity/icons'
import {Box, Button, Dialog, Flex, useClickOutside} from '@sanity/ui'
import {type FormEvent, useCallback, useState} from 'react'

import {type BundleDocument} from '../../../store/bundles/types'
import {useBundleOperations} from '../../../store/bundles/useBundleOperations'
import {isDraftOrPublished} from '../../util/dummyGetters'
import {BundleForm} from './BundleForm'

export function CreateBundleDialog(props: {onClose: () => void}): JSX.Element {
  const {onClose} = props
  const {createBundle} = useBundleOperations()

  const [value, setValue] = useState<Partial<BundleDocument>>({
    name: '',
    title: '',
    tone: undefined,
    publishAt: undefined,
  })
  const [isCreating, setIsCreating] = useState(false)
  const [formRef, setFormRef] = useState<HTMLDivElement | null>(null)

  const handleOnSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      try {
        event.preventDefault()
        setIsCreating(true)
        await createBundle(value)
        setValue(value)
      } catch (err) {
        console.error(err)
      } finally {
        setIsCreating(false)
        onClose()
      }
    },
    [createBundle, value, onClose],
  )

  useClickOutside(onClose, [formRef])

  return (
    <Dialog
      animate
      header="Create release"
      id="create-bundle-dialog"
      onClose={onClose}
      zOffset={5000}
      width={1}
    >
      <form onSubmit={handleOnSubmit}>
        <Box padding={6} ref={setFormRef}>
          <BundleForm onChange={setValue} value={value} />
        </Box>
        <Flex justify="flex-end" padding={3}>
          <Button
            disabled={!value.title || isDraftOrPublished(value.title) || isCreating}
            iconRight={ArrowRightIcon}
            type="submit"
            // localize Text
            // eslint-disable-next-line @sanity/i18n/no-attribute-string-literals
            text="Create release"
            loading={isCreating}
          />
        </Flex>
      </form>
    </Dialog>
  )
}
