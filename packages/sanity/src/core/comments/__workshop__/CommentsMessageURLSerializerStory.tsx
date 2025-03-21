import {Card, Container, Stack} from '@sanity/ui'

import {CommentMessageSerializer} from '../components/pte/CommentMessageSerializer'
import {type CommentMessage} from '../types'

const BLOCKS: CommentMessage = [
  {
    _type: 'block',
    _key: '123',
    style: 'normal',
    markDefs: [],
    children: [
      {
        _type: 'span',
        _key: '123',
        text: 'Link 1: https://www.sanity.io',
        marks: [],
      },
      {
        _type: 'span',
        _key: '456',
        text: 'Link 2: www.sanity.io',
      },
      {
        _type: 'span',
        _key: '789',
        text: 'Link 3: (https://www.sanity.io/docs)',
      },
      {
        _type: 'span',
        _key: '101',
        text: 'Link 4: www.sanity (invalid)',
      },
      {
        _type: 'span',
        _key: '112',
        text: 'Link 5: with comma https://www.sanity.io, after the link',
      },
    ],
  },
]

export default function CommentsMessageURLSerializerStory(): React.JSX.Element {
  return (
    <Container width={1} padding={4} sizing="border">
      <Stack space={4}>
        <Card border padding={4} sizing="border">
          <CommentMessageSerializer blocks={BLOCKS} />
        </Card>
      </Stack>
    </Container>
  )
}
