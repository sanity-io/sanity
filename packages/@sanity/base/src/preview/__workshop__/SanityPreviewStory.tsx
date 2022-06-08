import {Box, Card, Container} from '@sanity/ui'
import {useSelect} from '@sanity/ui-workshop'
import React, {useMemo} from 'react'
import {useSchema} from '../../hooks'
import {PreviewLayoutKey} from '../../components/previews'
import {SanityPreview} from '../components/SanityPreview'
import {Previewable} from '../types'

const LAYOUT_OPTIONS: Record<string, PreviewLayoutKey> = {
  Default: 'default',
  Detail: 'detail',
  Media: 'media',

  Inline: 'inline',
  Block: 'block',
  BlockImage: 'blockImage',
}

export default function SanityPreviewStory() {
  const layout = useSelect('Layout', LAYOUT_OPTIONS)
  const schema = useSchema()
  const schemaType = schema.get('author')!
  const value: Previewable = useMemo(() => ({_id: 'grrm', _type: 'author'}), [])

  return (
    <Box padding={4}>
      <Container width={1}>
        <Card border padding={2} radius={2} style={{lineHeight: 0}}>
          <SanityPreview layout={layout} schemaType={schemaType} value={value} />
        </Card>
      </Container>
    </Box>
  )
}
