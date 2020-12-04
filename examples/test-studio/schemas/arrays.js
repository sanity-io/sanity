import React from 'react'
import {MdFormatListNumbered as icon} from 'react-icons/md'

export const topLevelArrayType = {
  name: 'topLevelArrayType',
  type: 'array',
  of: [
    {
      type: 'object',
      title: 'Content',
      fields: [
        {name: 'textContent', type: 'text'},
        {name: 'imageContent', type: 'image'},
      ],
      preview: {select: {title: 'textContent'}},
    },
  ],
}
export const topLevelPrimitiveArrayType = {
  name: 'topLevelPrimitiveArrayType',
  type: 'array',
  of: [
    {
      type: 'string',
      title: 'A string',
    },
    {
      type: 'number',
      title: 'A number',
    },
  ],
}

export default {
  name: 'arraysTest',
  type: 'document',
  title: 'Arrays test',
  icon,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'arrayOfMultipleTypes',
      title: 'Array of multiple types',
      type: 'array',
      of: [
        {
          type: 'image',
          icon: icon,
        },
        {
          type: 'book',
        },
        {
          type: 'object',
          name: 'color',
          title: 'Color with a long title',
          fields: [
            {
              name: 'title',
              type: 'string',
            },
            {
              name: 'name',
              type: 'string',
            },
          ],
        },
      ],
    },
    {
      name: 'arrayOfMultipleTypesPopover',
      title: 'Array of multiple types (editModal=popover)',
      options: {
        editModal: 'popover',
      },
      type: 'array',
      of: [
        {
          type: 'image',
          icon: icon,
        },
        {
          type: 'book',
        },
        {
          type: 'object',
          name: 'color',
          title: 'Color with a long title',
          fields: [
            {
              name: 'title',
              type: 'string',
            },
            {
              name: 'name',
              type: 'string',
            },
          ],
        },
      ],
    },
    {
      name: 'arrayOfMultipleTypesFullscreen',
      title: 'Array of multiple types (editModal=fullscreen)',
      options: {
        editModal: 'fullscreen',
      },
      type: 'array',
      of: [
        {
          type: 'image',
          icon: icon,
        },
        {
          type: 'book',
        },
        {
          type: 'object',
          name: 'color',
          title: 'Color with a long title',
          fields: [
            {
              name: 'title',
              type: 'string',
            },
            {
              name: 'name',
              type: 'string',
            },
          ],
        },
      ],
    },
    {
      name: 'arrayOfMultipleTypesFold',
      title: 'Array of multiple types (editModal=fold)',
      options: {
        editModal: 'fold',
      },
      type: 'array',
      of: [
        {
          type: 'image',
          icon: icon,
        },
        {
          type: 'book',
        },
        {
          type: 'object',
          name: 'color',
          title: 'Color with a long title',
          fields: [
            {
              name: 'title',
              type: 'string',
            },
            {
              name: 'name',
              type: 'string',
            },
          ],
        },
      ],
    },
    {
      name: 'arrayOfPredefinedOptions',
      title: 'Array of predefined options',
      description: [
        'It should be possible to check/uncheck the different options.',
        'There should be a warning about invalid type (number)',
        'When inspecting a document with checked values, the array should contain values with: ',
        '{_type: "color", ...}',
      ].join('\n'),
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'color',
          fields: [
            {
              name: 'title',
              type: 'string',
            },
            {
              name: 'name',
              type: 'string',
            },
          ],
          preview: {
            select: {
              title: 'title',
              name: 'name',
            },
            prepare({title, name}) {
              return {
                title: title,
                // eslint-disable-next-line react/display-name
                media: () => (
                  <div
                    style={{
                      backgroundColor: name,
                      position: 'absolute',
                      height: '100%',
                      width: '100%',
                      top: '0',
                      left: '0',
                    }}
                  />
                ),
              }
            },
          },
        },
      ],
      options: {
        direction: 'vertical',
        list: [
          {_type: 'color', title: 'Red', name: 'red', _key: 'red'},
          {_type: 'color', title: 'Green', name: 'green', _key: 'green'},
          1, // invalid, not defined in list
          {_type: 'color', title: 'Blue', name: 'blue', _key: 'blue'},
          {_type: 'color', title: 'Black', name: 'black', _key: 'black'},
        ],
      },
    },
    {
      name: 'tags',
      title: 'Tags',
      description:
        'Enter a tag and press enter. Should result in an array of strings and should be possible to remove items',
      type: 'array',
      options: {layout: 'tags'},
      of: [{type: 'string'}],
    },
    {
      name: 'arrayWithAnonymousObject',
      title: 'Array with anonymous objects',
      description: 'This array contains objects of type as defined inline',
      type: 'array',
      of: [
        {
          type: 'object',
          title: 'Something',
          fields: [
            {name: 'first', type: 'string', title: 'First string'},
            {name: 'second', type: 'string', title: 'Second string'},
          ],
        },
      ],
    },
    {
      name: 'arrayOfPrimitives',
      title: 'Array with primitive types',
      description: 'This array contains only strings, values and booleans',
      type: 'array',
      of: [
        {
          type: 'string',
          title: 'String',
        },
        {
          type: 'number',
          title: 'Number',
        },
        {
          type: 'boolean',
          title: 'Boolean',
        },
      ],
    },
    {
      name: 'arrayOfEmails',
      title: 'Array of email addresses',
      description: 'This array contains only email addresses',
      type: 'array',
      of: [
        {
          type: 'email',
          title: '',
        },
      ],
    },
    {
      name: 'arrayOfStringsWithLegacyList',
      title: 'Array of strings with legacy format on lists',
      description:
        'Previously the `list` option took an array of {title, value} items. It should still be possible to check these values.',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        list: [
          {value: 'residential', title: 'Residential'},
          {value: 'education', title: 'Education'},
          {value: 'commercial', title: 'Commercial'},
          {value: 'cultural', title: 'Cultural'},
          {value: 'display', title: 'Display'},
          {value: 'installation', title: 'Installation'},
          {value: 'objects', title: 'Objects'},
          {value: 'performance', title: 'Performance'},
          {value: 'public space', title: 'Public Space'},
          {value: 'publications', title: 'Publications'},
        ],
      },
    },
    {
      name: 'fieldOfTopLevelArrayType',
      title: 'Field of top level array type',
      type: 'topLevelArrayType',
    },
    {
      name: 'fieldOfTopLevelPrimitiveArrayType',
      title: 'Field of top level primitive array type',
      type: 'topLevelPrimitiveArrayType',
    },
    {
      name: 'imageArrayInGrid',
      title: 'Image array',
      description: 'An array of images. options: {layout: "grid"}',
      type: 'array',
      options: {
        layout: 'grid',
      },
      of: [
        {
          name: 'myImage',
          title: 'My Image',
          type: 'myImage',
        },
      ],
    },
    {
      name: 'imageArray',
      title: 'Image array (with defaults)',
      type: 'array',
      of: [
        {
          title: 'Image',
          type: 'image',
          preview: {
            select: {
              imageUrl: 'asset.url',
              title: 'caption',
            },
          },
          fields: [
            {
              name: 'caption',
              type: 'string',
              title: 'Caption',
              options: {
                isHighlighted: true,
              },
            },
          ],
        },
      ],
    },
    {
      name: 'polymorphicGridArray',
      title: 'Polymorphic grid array',
      description: 'An array of multiple types. options: {layout: "grid"}',
      type: 'array',
      options: {
        layout: 'grid',
      },
      of: [
        {
          title: 'A book',
          type: 'book',
        },
        {
          title: 'An author',
          type: 'author',
        },
        {
          title: 'An image',
          type: 'image',
        },
      ],
    },
    {
      name: 'imageArrayNotSortable',
      title: 'Image array in grid, *not* sortable',
      description: 'Images here should be append-only',
      type: 'array',
      options: {
        sortable: false,
        layout: 'grid',
      },
      of: [
        {
          title: 'Image',
          type: 'image',
          preview: {
            select: {
              imageUrl: 'asset.url',
              title: 'caption',
            },
          },
          fields: [
            {
              name: 'caption',
              type: 'string',
              title: 'Caption',
              options: {
                isHighlighted: true,
              },
            },
          ],
        },
      ],
    },
    {
      name: 'arrayOfNamedReferences',
      type: 'array',
      title: 'Array of named references',
      description: 'The values here should get _type == authorReference or _type == bookReference',
      of: [
        {
          type: 'reference',
          name: 'authorReference',
          to: [{type: 'author', title: 'Reference to author'}],
        },
        {
          type: 'reference',
          name: 'bookReference',
          to: [{type: 'book', title: 'Reference to book'}],
        },
      ],
    },
    {
      name: 'arrayOfSoManyDifferentTypes',
      type: 'array',
      title: 'Array of SO MANY different types',
      describe: 'Uses custom "Add" functionality',
      of: ['author', 'book', 'code', 'color', 'geopoint', 'image', 'slug', 'species'].map(
        (type) => ({
          type,
        })
      ),
    },
  ],
}
