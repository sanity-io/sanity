import {
  defineArrayMember,
  defineField,
  defineType,
  type Path,
  type SanityDocument,
} from '@sanity/types'

import {TestForm} from '../../../../../../test/browser/TestForm'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'

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
            marks: {
              annotations: [
                defineField({
                  type: 'object',
                  name: 'link',
                  title: 'Link',
                  fields: [
                    defineField({
                      type: 'url',
                      name: 'href',
                      title: 'URL',
                    }),
                    defineField({
                      type: 'string',
                      name: 'linkedBook',
                      title: 'Linked Book',
                    }),
                    defineField({
                      type: 'boolean',
                      name: 'newTab',
                      title: 'Open in new tab?',
                    }),
                    defineField({
                      type: 'string',
                      name: 'iconName',
                      title: 'Icon',
                    }),
                  ],
                }),
              ],
            },
            of: [
              defineArrayMember({
                type: 'object',
                name: 'inlineObject',
                title: 'Inline Object',
                fields: [
                  defineField({
                    type: 'string',
                    name: 'title',
                    title: 'Title',
                  }),
                ],
                preview: {
                  select: {title: 'title'},
                  prepare({title}) {
                    return {title: title || 'Click to edit'}
                  },
                },
              }),
            ],
          }),
        ],
      }),
    ],
  }),
]

const LINK_KEY = 'linkMarkDef'
const FIRST_BLOCK_KEY = 'blockWithAnnotation'

/**
 * A document whose first block carries a link annotation, followed by blocks of
 * plain text that sit underneath the annotation's edit popover once it opens.
 * The trailing text is what bleeds through when blended editor content is not
 * contained in its own isolation group.
 */
const DOCUMENT_WITH_ANNOTATION: SanityDocument = {
  _id: '123',
  _type: 'test',
  _createdAt: '2024-01-01T00:00:00.000Z',
  _updatedAt: '2024-01-01T00:00:00.000Z',
  _rev: 'rev',
  body: [
    {
      _key: FIRST_BLOCK_KEY,
      _type: 'block',
      style: 'normal',
      markDefs: [{_key: LINK_KEY, _type: 'link', href: 'https://www.sanity.io'}],
      children: [
        {_key: 'span1', _type: 'span', text: 'A ', marks: []},
        {_key: 'span2', _type: 'span', text: 'link', marks: [LINK_KEY]},
        {_key: 'span3', _type: 'span', text: ' in text.', marks: []},
      ],
    },
    {
      _key: 'block2',
      _type: 'block',
      style: 'normal',
      markDefs: [],
      children: [{_key: 'span4', _type: 'span', text: 'fooo barrrr', marks: []}],
    },
    {
      _key: 'block3',
      _type: 'block',
      style: 'normal',
      markDefs: [],
      children: [{_key: 'span5', _type: 'span', text: 'aefaef', marks: []}],
    },
    {
      _key: 'block4',
      _type: 'block',
      style: 'normal',
      markDefs: [],
      children: [{_key: 'span6', _type: 'span', text: 'more text underneath', marks: []}],
    },
  ],
}

/** Opens the link annotation's edit popover on mount. */
const OPEN_ANNOTATION_PATH: Path = ['body', {_key: FIRST_BLOCK_KEY}, 'markDefs', {_key: LINK_KEY}]

interface PopoverStackingStoryProps {
  /** Render with the annotation edit popover already open over the text below it. */
  withOpenEditPopover?: boolean
}

export function PopoverStackingStory(props: PopoverStackingStoryProps) {
  const {withOpenEditPopover} = props

  if (withOpenEditPopover) {
    return (
      <TestWrapper schemaTypes={SCHEMA_TYPES}>
        <TestForm document={DOCUMENT_WITH_ANNOTATION} openPath={OPEN_ANNOTATION_PATH} />
      </TestWrapper>
    )
  }

  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <TestForm />
    </TestWrapper>
  )
}
