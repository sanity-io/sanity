import {Container, Flex} from '@sanity/ui'
import React from 'react'
import {MentionsMenu} from '../components/mentions'
import {useMentionOptions} from '../hooks'

const DOC = {
  documentValue: {
    _id: 'xyz123',
    _type: 'author',
    _rev: '1',
    _createdAt: '2021-05-04T14:54:37Z',
    _updatedAt: '2021-05-04T14:54:37Z',
  },
}

export default function MentionsMenuStory() {
  const {data, loading} = useMentionOptions(DOC)

  return (
    <Flex height="fill" align="center">
      <Container width={0}>
        <MentionsMenu
          options={data}
          loading={loading}
          onSelect={() => {
            //...
          }}
        />
      </Container>
    </Flex>
  )
}
