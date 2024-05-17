import {ComposeIcon, DropIcon, ImageIcon} from '@sanity/icons'

const linkType = {
  type: 'object',
  name: 'link',
  fields: [
    {
      type: 'string',
      name: 'href',
      validation: (Rule: any) => Rule.uri({scheme: ['http', 'https']}).required(),
    },
  ],
  options: {
    modal: {
      type: 'popover',
      width: 2,
    },
  },
}

export default {
  name: 'blocksTest',
  title: 'Blocks test',
  type: 'object',
  icon: ComposeIcon,
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
      of: [
        {
          type: 'block',
          marks: {
            annotations: [linkType],
          },
        },
      ],
    },
    {
      name: 'defaults',
      title: 'Content',
      description: 'Profound description of what belongs here',
      type: 'array',
      of: [
        {type: 'image', title: 'Image', icon: ImageIcon},
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
        {
          type: 'object',
          name: 'objectWithNestedArray',
          title: 'An object with nested array',
          fields: [
            {
              name: 'title',
              type: 'string',
            },
            {
              name: 'array',
              type: 'array',
              of: [
                {
                  type: 'object',
                  fields: [
                    {type: 'string', name: 'title'},
                    {type: 'reference', name: 'author', to: [{type: 'author'}]},
                  ],
                },
              ],
            },
          ],
        },
        {type: 'author', title: 'Embedded author'},
        {type: 'code', title: 'Code'},
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
      name: 'reproCH9436',
      title: 'Images',
      type: 'array',
      description: 'Repro case for https://app.clubhouse.io/sanity-io/story/9436/',
      of: [
        {type: 'block'},
        {
          name: 'imageWithPortableTextCaption',
          type: 'image',
          fields: [
            {
              name: 'caption',
              title: 'Caption',
              type: 'array',
              description:
                'The amount of toolbar buttons here should not affect the width of the PTE input or the width of the dialog which contains it',
              options: {isHighlighted: true},
              of: [
                {
                  title: 'Block',
                  type: 'block',
                  marks: {
                    decorators: [
                      // the number of decorators here will currently force the width of the PTE input
                      // to be wider than the dialog, which again makes the dialog content overflow
                      {title: 'Strong', value: 'strong'},
                      {title: 'Emphasis', value: 'em'},
                      {title: 'Underline', value: 'underline'},
                      {title: 'Strikethrough', value: 'strikethrough'},
                      {title: 'Superscript', value: 'superscript'},
                      {title: 'Subscript', value: 'subscript'},
                      {title: 'Left', value: 'alignleft'},
                      {title: 'Center', value: 'aligncenter'},
                      {title: 'Right', value: 'alignright'},
                      {title: 'Justify', value: 'alignjustify'},
                    ],
                  },
                },
              ],
            },
          ],
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
              {title: 'Decorator with custom icon', value: 'color', icon: DropIcon},
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
                icon: DropIcon,
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
