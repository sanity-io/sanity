import React from 'react'
import {
  MdRateReview as icon,
  MdPhotoLibrary as imageIcon,
  MdFormatColorFill as colorIcon,
} from 'react-icons/md'
import {BlockEditor} from 'part:@sanity/form-builder'

const CustomEditor = React.forwardRef((props, ref) => {
  const {markers, value} = props
  const newMarkers = markers.concat([
    {type: 'customMarkerTest', path: value && value[0] ? [{_key: value[0]._key}] : []},
  ])
  return <BlockEditor {...props} markers={newMarkers} ref={ref} />
})
CustomEditor.displayName = 'CustomEditor'
CustomEditor.propTypes = BlockEditor.propTypes // eslint-disable-line react/forbid-foreign-prop-types

export default {
  name: 'blocksTest',
  title: 'Blocks test',
  type: 'document',
  icon,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'first',
      title: 'Block array as first field',
      type: 'array',
      of: [{type: 'block'}],
    },
    {
      name: 'defaults',
      title: 'Content',
      description: 'Profound description of what belongs here',
      type: 'array',
      of: [
        {type: 'image', title: 'Image', icon: imageIcon},
        {
          type: 'reference',
          name: 'authorReference',
          to: {type: 'author'},
          title: 'Reference to author',
        },
        {
          type: 'reference',
          name: 'bookReference',
          to: {type: 'book'},
          title: 'Reference to book',
        },
        {type: 'author', title: 'Embedded author'},
        {type: 'code', title: 'Code'},
        {
          type: 'color',
          name: 'colorBlock',
          title: 'Color (block)',
          icon: colorIcon,
        },
        {
          type: 'object',
          title: 'Test object',
          name: 'testObject',
          fields: [{name: 'field1', type: 'string'}],
        },
        {
          type: 'object',
          title: 'Other test object',
          name: 'otherTestObject',
          fields: [
            {name: 'field1', type: 'string'},
            {
              name: 'field3',
              type: 'array',
              of: [
                {
                  type: 'object',
                  fields: [
                    {name: 'aString', type: 'string'},
                    {name: 'aNumber', type: 'number'},
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'block',
          of: [
            {
              type: 'color',
              title: 'Color',
            },
          ],
        },
        {
          type: 'spotifyEmbed',
          name: 'spotifyEmbed',
          title: 'Spotify embed',
        },
      ],
    },
    {
      name: 'nestedWithDualColumnCTA',
      title: 'Nested, with dual column CTA',
      type: 'array',
      of: [
        {
          name: 'localeRichtext',
          type: 'object',
          fields: [
            {
              title: 'English',
              name: 'en',
              type: 'array',
              of: [
                {type: 'block'},
                {type: 'image'},
                {
                  name: 'twoColCTA',
                  type: 'object',
                  title: 'Two Column CTA',
                  description: 'Inserts two content blocks.',
                  fields: [
                    {
                      name: 'columnone',
                      title: 'Column One',
                      type: 'array',
                      of: [{type: 'richTextObject'}],
                    },
                    {
                      name: 'columntwo',
                      title: 'Column Two',
                      type: 'array',
                      of: [{type: 'richTextObject'}],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'readOnlyWithDefaults',
      title: 'Read only with defaults',
      description: 'This is read only',
      type: 'array',
      readOnly: true,
      of: [
        {type: 'image', title: 'Image'},
        {
          type: 'reference',
          name: 'authorReference',
          to: {type: 'author'},
          title: 'Reference to author',
        },
        {
          type: 'reference',
          name: 'bookReference',
          to: {type: 'book'},
          title: 'Reference to book',
        },
        {type: 'author', title: 'Embedded author'},
        {type: 'code', title: 'Code'},
        {
          type: 'color',
          name: 'colorBlock',
          title: 'Color (block)',
        },
        {
          type: 'object',
          title: 'Test object',
          name: 'testObject',
          fields: [{name: 'field1', type: 'string'}],
        },
        {
          type: 'object',
          title: 'Other test object',
          name: 'otherTestObject',
          fields: [
            {name: 'field1', type: 'string'},
            {
              name: 'field3',
              type: 'array',
              of: [
                {
                  type: 'object',
                  fields: [
                    {name: 'aString', type: 'string'},
                    {name: 'aNumber', type: 'number'},
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'block',
          of: [
            {
              type: 'color',
              title: 'Color',
            },
          ],
        },
      ],
    },
    {
      name: 'minimal',
      title: 'Reset all options',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [],
          lists: [],
          marks: {
            decorators: [],
            annotations: [],
          },
        },
      ],
    },
    {
      name: 'customized',
      title: 'Customized with block types',
      type: 'array',
      of: [
        {type: 'author', title: 'Author'},
        {
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'H1', value: 'h1'},
            {title: 'H2', value: 'h2'},
            {title: 'Quote', value: 'blockquote'},
          ],
          lists: [
            {title: 'Bullet', value: 'bullet'},
            {title: 'Numbered', value: 'number'},
          ],
          marks: {
            decorators: [
              {title: 'Strong', value: 'strong'},
              {title: 'Emphasis', value: 'em'},
              {title: 'Decorator with custom icon', value: 'color', icon: colorIcon},
            ],
            annotations: [
              {
                name: 'Author',
                title: 'Author',
                type: 'reference',
                to: {type: 'author'},
              },
              {
                title: 'Annotation with custom icon',
                name: 'test',
                type: 'object',
                icon: colorIcon,
                fields: [
                  {
                    name: 'testString',
                    type: 'string',
                  },
                ],
              },
            ],
          },
          of: [
            {
              type: 'image',
              title: 'Image',
              fields: [
                {title: 'Caption', name: 'caption', type: 'string', options: {isHighlighted: true}},
                {
                  title: 'Authors',
                  name: 'authors',
                  type: 'array',
                  options: {isHighlighted: true},
                  of: [{type: 'author', title: 'Author'}],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'withGeopoint',
      title: 'With geopoints',
      type: 'array',
      of: [{type: 'block'}, {type: 'geopoint'}],
    },
    {
      name: 'withMarkers',
      title: 'With markers',
      type: 'array',
      inputComponent: CustomEditor,
      of: [{type: 'block'}],
    },
    {
      name: 'deep',
      title: 'Blocks deep down',
      type: 'object',
      fields: [
        {name: 'something', title: 'Something', type: 'string'},
        {
          name: 'blocks',
          type: 'array',
          title: 'Blocks',
          of: [
            {type: 'image', title: 'Image'},
            {type: 'author', title: 'Author'},
            {
              type: 'block',
              styles: [
                {title: 'Normal', value: 'normal'},
                {title: 'H1', value: 'h1'},
                {title: 'H2', value: 'h2'},
                {title: 'Quote', value: 'blockquote'},
              ],
              lists: [
                {title: 'Bullet', value: 'bullet'},
                {title: 'Numbered', value: 'number'},
              ],
              marks: {
                decorators: [
                  {title: 'Strong', value: 'strong'},
                  {title: 'Emphasis', value: 'em'},
                ],
                annotations: [
                  {name: 'Author', title: 'Author', type: 'reference', to: {type: 'author'}},
                ],
              },
            },
          ],
        },
      ],
    },
    {
      title: 'Array of articles',
      name: 'arrayOfArticles',
      type: 'array',
      of: [
        {
          type: 'blocksTest',
        },
      ],
    },
    {
      title: 'Block in block',
      name: 'blockInBlock',
      type: 'array',
      of: [
        {
          type: 'block',
          of: [
            {
              name: 'footnote',
              title: 'Footnote',
              type: 'object',
              fields: [
                {
                  title: 'Footnote',
                  name: 'footnote',
                  type: 'array',
                  of: [
                    {
                      type: 'block',
                      lists: [],
                      styles: [],
                      marks: {
                        decorators: [
                          {title: 'Strong', value: 'strong'},
                          {title: 'Emphasis', value: 'em'},
                        ],
                        annotations: [],
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'recursive',
      type: 'object',
      fields: [
        {
          name: 'blocks',
          type: 'array',
          title: 'Blocks',
          of: [
            {
              type: 'block',
              styles: [],
              lists: [],
              marks: {
                decorators: [],
                annotations: [],
              },
            },
            {
              type: 'blocksTest',
              title: 'Blocks test!',
            },
          ],
        },
      ],
    },
    {
      name: 'blockList',
      title: 'Array of blocks',
      type: 'array',
      of: [
        {
          name: 'blockListEntry',
          type: 'object',
          fields: [
            {
              name: 'title',
              title: 'Title',
              type: 'string',
            },
            {
              name: 'blocks',
              type: 'array',
              of: [{type: 'block'}],
            },
          ],
        },
      ],
    },
  ],
}
