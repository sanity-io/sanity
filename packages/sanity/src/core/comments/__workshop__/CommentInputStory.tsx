import {type PortableTextBlock} from '@sanity/types'
import {Card, Container, Flex} from '@sanity/ui'
import {useBoolean} from '@sanity/ui-workshop'
import {useState} from 'react'

import {useCurrentUser} from '../../store/user/hooks'
import {CommentInput} from '../components/pte/comment-input/CommentInput'
import {CommentMessageSerializer} from '../components/pte/CommentMessageSerializer'

const noop = () => {
  // ...
}

export default function CommentsInputStory() {
  const [value, setValue] = useState<PortableTextBlock[] | null>(null)
  const currentUser = useCurrentUser()
  const expandOnFocus = useBoolean('Expand on focus', false, 'Props')
  const readOnly = useBoolean('Read only', false, 'Props')

  if (!currentUser) return null

  return (
    <Flex height="fill">
      <Card flex={1} padding={4} paddingY={8}>
        <Container width={0}>
          <CommentInput
            currentUser={currentUser}
            expandOnFocus={expandOnFocus}
            mentionOptions={{data: [], error: null, loading: false}}
            onChange={setValue}
            onDiscardCancel={noop}
            onDiscardConfirm={noop}
            onSubmit={noop}
            readOnly={readOnly}
            value={value}
          />
        </Container>
      </Card>

      <Card borderLeft flex={1}>
        <Card flex={1} padding={4} paddingY={8}>
          <Container width={0}>
            <CommentMessageSerializer blocks={value || []} />
          </Container>
        </Card>
      </Card>
    </Flex>
  )
}
