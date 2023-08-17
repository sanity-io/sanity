import {Box, Card, Container} from '@sanity/ui'
import {useSelect} from '@sanity/ui-workshop'
import React, {useMemo} from 'react'
import {Image, ObjectSchemaType} from '@sanity/types'
import {PreviewLoader} from '../components/PreviewLoader'
import {Previewable} from '../types'
import {PreviewLayoutKey} from '../../components'
import {useSchema} from '../../hooks'
import {Preview} from '../components/Preview'

const LAYOUT_OPTIONS: Record<string, PreviewLayoutKey> = {
  Default: 'default',
  Detail: 'detail',
  Media: 'media',

  Inline: 'inline',
  Block: 'block',
  BlockImage: 'blockImage',
}

const VALUE_TYPES: Record<string, 'document' | 'image'> = {
  Document: 'document',
  Image: 'image',
}

export default function SanityPreviewStory() {
  const layout = useSelect('Layout', LAYOUT_OPTIONS)
  const type = useSelect('Value type', VALUE_TYPES)

  const schema = useSchema()
  const schemaType = useMemo(() => {
    if (type === 'image') {
      return (schema.get('imagesTest') as ObjectSchemaType).fields.find(
        (f) => f.name === 'mainImage',
      )!.type
    }

    return schema.get('author')!
  }, [schema, type])

  const value: Previewable | Image = useMemo(() => {
    if (type === 'image') {
      return {
        _type: 'image',
        asset: {
          _ref: 'image-4af4353791af3fd4594c59f5bdc9f5f4a4aba3db-6240x4160-jpg',
          _type: 'reference',
        },
      }
    }

    return {_id: 'grrm', _type: 'author'}
  }, [type])

  return (
    <Box padding={4}>
      <Container width={1}>
        <Card border padding={2} radius={2} style={{lineHeight: 0}}>
          <Preview layout={layout} schemaType={schemaType} value={value} />
        </Card>
      </Container>
    </Box>
  )
}
