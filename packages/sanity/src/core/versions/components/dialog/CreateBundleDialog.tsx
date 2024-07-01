import {ArrowRightIcon} from '@sanity/icons'
import {Box, Button, Dialog, Flex} from '@sanity/ui'
import {useCallback, useState} from 'react'
import {useCurrentUser} from 'sanity'

import {type BundleDocument} from '../../../store/bundles/types'
import {isDraftOrPublished} from '../../util/dummyGetters'
import {BundleForm} from './BundleForm'

export function CreateBundleDialog(props: {
  onCancel: () => void
  onSubmit: (value: BundleDocument) => void
}): JSX.Element {
  const {onCancel, onSubmit} = props
  const currentUser = useCurrentUser()

  const [value, setValue] = useState<BundleDocument>({
    _type: 'bundle',
    _rev: '',
    authorId: currentUser?.id || '',
    _id: '',
    _createdAt: new Date().toDateString(),
    _updatedAt: new Date().toDateString(),
    // Add any other missing properties here
    name: '',
    title: '',
    tone: undefined,
    publishAt: '',
  })

  const handleOnSubmit = useCallback(
    () => (bundle: BundleDocument) => {
      setValue({
        ...value,
        ...{
          _createdAt: new Date().toDateString(),
          _updatedAt: new Date().toDateString(),
        },
      })
      onSubmit(bundle)
    },
    [onSubmit, value],
  )

  return (
    <Dialog
      animate
      header="Create release"
      id="create-bundle-dialog"
      onClose={onCancel}
      zOffset={5000}
      width={1}
    >
      <Box padding={6}>
        <BundleForm onChange={setValue} value={value} />
      </Box>
      <Flex justify="flex-end" padding={3}>
        <Button
          disabled={!value.title || isDraftOrPublished(value.title)}
          iconRight={ArrowRightIcon}
          onClick={handleOnSubmit}
          // localize Text
          // eslint-disable-next-line @sanity/i18n/no-attribute-string-literals
          text="Create release"
        />
      </Flex>
    </Dialog>
  )
}
