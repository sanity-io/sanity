import {Box, Card, Container} from '@sanity/ui'
import {useSelect, useString} from '@sanity/ui-workshop'
import React, {useMemo} from 'react'
import {useSource} from '../../studio'
import {RenderPreviewSnapshot} from '../components/RenderPreviewSnapshot'
import {WORKSHOP_PREVIEW_LAYOUT} from './constants'

export default function RenderPreviewSnapshotStory() {
  const {schema} = useSource()
  const layout = useSelect('Layout', WORKSHOP_PREVIEW_LAYOUT, 'default')
  const title = useString('Title', 'Title')
  const subtitle = useString('Subtitle', 'Subtitle')
  const documentValue = useMemo(
    () => ({_type: 'author', _id: 'foo', title, subtitle}),
    [title, subtitle]
  )
  const schemaType = schema.get(documentValue._type)!

  return (
    <Box padding={4}>
      <Container width={0}>
        <Card border style={{lineHeight: 0}}>
          <RenderPreviewSnapshot
            isLoading={false}
            layout={layout}
            schemaType={schemaType}
            snapshot={documentValue}
          />
        </Card>
      </Container>
    </Box>
  )
}
