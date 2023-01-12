import {Container, Flex} from '@sanity/ui'
import {useBoolean} from '@sanity/ui-workshop'
import React, {useCallback, useState} from 'react'
import {TagInput} from '../../components/tagInput'

interface Tag {
  value: string
}

const INITIAL_VALUE: Tag[] = [{value: 'foo'}, {value: 'bar'}, {value: 'baz'}]

export default function TagInputStory() {
  const readOnly = useBoolean('readOnly', false)
  const [tags, setTags] = useState<Tag[]>(INITIAL_VALUE)

  const handleChange = useCallback((nextValue: Tag[]) => {
    setTags(nextValue)
  }, [])

  return (
    <Flex align="center" height="fill">
      <Container width={1} padding={4}>
        <TagInput value={tags} onChange={handleChange} readOnly={readOnly} />
      </Container>
    </Flex>
  )
}
