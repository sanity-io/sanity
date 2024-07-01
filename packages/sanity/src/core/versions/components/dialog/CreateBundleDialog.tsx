import {ArrowRightIcon} from '@sanity/icons'
import {Box, Button, Dialog, Flex} from '@sanity/ui'
import {useCallback, useState} from 'react'

import {type Bundle} from '../../types'
import {isDraftOrPublished} from '../../util/dummyGetters'
import {BundleForm} from './BundleForm'

export function CreateBundleDialog(props: {
  onCancel: () => void
  onSubmit: (value: Bundle) => void
}): JSX.Element {
  const {onCancel, onSubmit} = props

  const [value, setValue] = useState<Bundle>({
    name: '',
    title: '',
    tone: undefined,
    publishAt: undefined,
  })

  const handleOnSubmit = useCallback(
    () => (bundle: Bundle) => {
      onSubmit(bundle)
    },
    [onSubmit],
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
