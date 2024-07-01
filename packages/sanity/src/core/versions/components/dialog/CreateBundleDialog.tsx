import {ArrowRightIcon} from '@sanity/icons'
import {Box, Button, Dialog, Flex} from '@sanity/ui'
import {useCallback, useState} from 'react'
import {useCurrentUser} from 'sanity'

import {useBundleOperations} from '../../../store/bundles/useBundleOperations'
import {type Bundle} from '../../types'
import {getRandomToneIcon, isDraftOrPublished} from '../../util/dummyGetters'
import {BundleForm} from './BundleForm'

export function CreateBundleDialog(props: {
  onCancel: () => void
  onCreate: (value: Bundle) => void
}): JSX.Element {
  const {onCancel, onCreate} = props
  const {createBundle} = useBundleOperations()
  const currentUser = useCurrentUser()
  const [isCreating, setIsCreating] = useState(false)

  const [value, setValue] = useState<Bundle>({
    name: '',
    title: '',
    tone: undefined,
    publishAt: undefined,
  })

  const handleOnSubmit = useCallback(
    async (bundle: Bundle) => {
      setIsCreating(true)
      try {
        await createBundle({
          _type: 'bundle',
          name: value.title,
          authorId: currentUser?.id,
          title: value.title,
          description: value.description,
          ...getRandomToneIcon(),
        })

        onCreate(bundle)
      } catch (e) {
        console.error(e)
      } finally {
        setIsCreating(false)
      }
    },
    [createBundle, currentUser?.id, onCreate, value.description, value.title],
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
          loading={isCreating}
          disabled={!value.title || isDraftOrPublished(value.title) || isCreating}
          iconRight={ArrowRightIcon}
          onClick={() => handleOnSubmit(value)}
          // localize Text
          // eslint-disable-next-line @sanity/i18n/no-attribute-string-literals
          text="Create release"
        />
      </Flex>
    </Dialog>
  )
}
