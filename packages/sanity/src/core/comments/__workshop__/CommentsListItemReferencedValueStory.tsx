import {Container, Flex} from '@sanity/ui'
import {useBoolean, useText} from '@sanity/ui-workshop'
import {useMemo} from 'react'

import {CommentsListItemReferencedValue} from '../components/list/CommentsListItemReferencedValue'

export default function CommentsListItemReferencedValueStory() {
  const text = useText('value', 'This is a referenced value') || 'This is a referenced value'
  const hasReferencedValue = useBoolean('Has referenced value', true)

  const value = useMemo(() => {
    return [
      {
        _key: 'abc',
        _type: 'block',
        markDefs: [],
        children: [
          {
            _key: '123',
            _type: 'span',
            marks: [],
            text,
          },
        ],
      },
    ]
  }, [text])

  return (
    <Flex align="center" height="fill">
      <Container width={0}>
        <CommentsListItemReferencedValue value={value} hasReferencedValue={hasReferencedValue} />
      </Container>
    </Flex>
  )
}
