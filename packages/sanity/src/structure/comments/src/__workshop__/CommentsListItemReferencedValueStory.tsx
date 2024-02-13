import {Container, Flex} from '@sanity/ui'
import {useText} from '@sanity/ui-workshop'

import {CommentsListItemReferencedValue} from '../components'

export default function CommentsListItemReferencedValueStory() {
  const text = useText('value', 'This is a referenced value') || 'This is a referenced value'

  return (
    <Flex align="center" height="fill">
      <Container width={0}>
        <CommentsListItemReferencedValue value={text} />
      </Container>
    </Flex>
  )
}
