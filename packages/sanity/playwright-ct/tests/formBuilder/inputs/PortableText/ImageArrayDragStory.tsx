import {type SanityDocument} from '@sanity/client'
import {defineArrayMember, defineField, defineType, type Path} from '@sanity/types'

import {TestForm} from '../../utils/TestForm'
import {TestWrapper} from '../../utils/TestWrapper'

const SCHEMA_TYPES = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({
        type: 'array',
        name: 'body',
        of: [
          defineArrayMember({
            type: 'block',
          }),
          defineArrayMember({
            type: 'object',
            name: 'imageSlideshow',
            title: 'Image slideshow',
            fields: [
              defineField({
                name: 'images',
                type: 'array',
                title: 'Images',
                of: [
                  defineArrayMember({
                    type: 'image',
                    options: {
                      hotspot: true,
                    },
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  }),
]

export function ImageArrayDragStory({
  focusPath,
  onPathFocus,
  document,
}: {
  focusPath?: Path
  onPathFocus?: (path: Path) => void
  document?: SanityDocument
}) {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <TestForm document={document} focusPath={focusPath} onPathFocus={onPathFocus} />
    </TestWrapper>
  )
}

export default ImageArrayDragStory
