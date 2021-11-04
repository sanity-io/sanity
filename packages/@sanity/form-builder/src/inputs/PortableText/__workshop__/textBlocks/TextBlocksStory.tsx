import {Box, Card, Container} from '@sanity/ui'
import {useAction, useBoolean} from '@sanity/ui-workshop'
import React, {useMemo} from 'react'
import {TextBlock} from '../../text'

const errorMarker = {
  type: 'validation',
  level: 'error',
  path: [{_key: 'a'}],
  item: {message: 'There is an error with this text block'},
}

const customMarker = {
  type: 'test',
  path: [{_key: 'a'}],
  item: {message: '1 comment'},
}

const blockBase = {
  _type: 'myBlockType',
  _key: 'a',
  style: 'normal',
  markDefs: [],
  children: [
    {
      _type: 'span',
      _key: 'a1',
      text:
        "This is a custom portable text block above an empty image block! It's the block below. There should be a nice margin below me?",
      marks: [],
    },
  ],
}

export function TextBlocksStory() {
  const hasErrors = useBoolean('Has errors', false)
  const hasMarkers = useBoolean('Has markers', false)
  const markers: any = useMemo(
    () => [...(hasErrors ? [errorMarker] : []), ...(hasMarkers ? [customMarker] : [])],
    [hasErrors, hasMarkers]
  )
  const onChange = useAction('onChange')
  const attributes = useMemo(() => ({focused: false, selected: false, path: []}), [])
  const readOnly = false

  return (
    <Box padding={4}>
      <Container width={1}>
        <Card padding={3} shadow={1} overflow="auto" style={{maxHeight: '100%'}}>
          <TextBlock
            markers={markers}
            block={{...blockBase, style: 'h1'}}
            onChange={onChange}
            attributes={attributes}
            readOnly={readOnly}
          >
            Heading 1
          </TextBlock>

          <TextBlock
            markers={markers}
            block={{...blockBase, style: 'normal'}}
            onChange={onChange}
            attributes={attributes}
            readOnly={readOnly}
          >
            Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum
            has been the industry's standard dummy text ever since the 1500s, when an unknown
            printer took a galley of type and scrambled it to make a type specimen book.
          </TextBlock>

          <TextBlock
            markers={markers}
            block={{...blockBase, style: 'normal', listItem: 'number', level: 1}}
            onChange={onChange}
            attributes={attributes}
            readOnly={readOnly}
          >
            Lorem Ipsum is simply dummy text of the printing and typesetting industry.
          </TextBlock>

          <TextBlock
            markers={markers}
            block={{...blockBase, style: 'normal', listItem: 'number', level: 1}}
            onChange={onChange}
            attributes={attributes}
            readOnly={readOnly}
          >
            Lorem Ipsum is simply dummy text of the printing and typesetting industry.
          </TextBlock>

          <TextBlock
            markers={markers}
            block={{...blockBase, style: 'normal', listItem: 'number', level: 3}}
            onChange={onChange}
            attributes={attributes}
            readOnly={readOnly}
          >
            Lorem Ipsum is simply dummy text of the printing and typesetting industry.
          </TextBlock>

          <TextBlock
            markers={markers}
            block={{...blockBase, style: 'normal', listItem: 'number', level: 3}}
            onChange={onChange}
            attributes={attributes}
            readOnly={readOnly}
          >
            Lorem Ipsum is simply dummy text of the printing and typesetting industry.
          </TextBlock>

          <TextBlock
            markers={markers}
            block={{...blockBase, style: 'h2'}}
            onChange={onChange}
            attributes={attributes}
            readOnly={readOnly}
          >
            Heading 2
          </TextBlock>

          <TextBlock
            markers={markers}
            block={{...blockBase, style: 'normal'}}
            onChange={onChange}
            attributes={attributes}
            readOnly={readOnly}
          >
            Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum
            has been the industry's standard dummy text ever since the 1500s, when an unknown
            printer took a galley of type and scrambled it to make a type specimen book.
          </TextBlock>

          <TextBlock
            markers={markers}
            block={{...blockBase, style: 'normal', listItem: 'bullet', level: 1}}
            onChange={onChange}
            attributes={attributes}
            readOnly={readOnly}
          >
            Lorem Ipsum is simply dummy text of the printing and typesetting industry.
          </TextBlock>

          <TextBlock
            markers={markers}
            block={{...blockBase, style: 'normal', listItem: 'bullet', level: 2}}
            onChange={onChange}
            attributes={attributes}
            readOnly={readOnly}
          >
            Lorem Ipsum is simply dummy text of the printing and typesetting industry.
          </TextBlock>

          <TextBlock
            block={{...blockBase, style: 'h3'}}
            markers={[]}
            onChange={onChange}
            attributes={attributes}
            readOnly={readOnly}
          >
            Heading 3
          </TextBlock>

          <TextBlock
            block={{...blockBase, style: 'normal'}}
            markers={markers}
            onChange={onChange}
            attributes={attributes}
            readOnly={readOnly}
          >
            Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum
            has been the industry's standard dummy text ever since the 1500s, when an unknown
            printer took a galley of type and scrambled it to make a type specimen book.
          </TextBlock>

          <TextBlock
            block={{...blockBase, style: 'blockquote'}}
            markers={markers}
            onChange={onChange}
            attributes={attributes}
            readOnly={readOnly}
          >
            Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum
            has been the industry's standard dummy text ever since the 1500s, when an unknown
            printer took a galley of type and scrambled it to make a type specimen book.
          </TextBlock>
        </Card>
      </Container>
    </Box>
  )
}
