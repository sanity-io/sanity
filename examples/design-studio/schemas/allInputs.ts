import author from './author'

const title = {
  type: 'string',
  name: 'title',
  title: 'Title',
}

// example fields

const arrayOfNestedArrays = {
  type: 'array',
  name: 'arrayOfNestedArrays',
  title: 'Array (0)',
  of: [
    {
      type: 'object',
      name: 'level1',
      title: 'Level 1',
      fields: [
        {type: 'string', name: 'title', title: 'Title'},
        {
          type: 'array',
          name: 'nestedArray',
          title: 'Nested array',
          of: [
            {
              type: 'object',
              name: 'level1',
              title: 'Level 1',
              fields: [
                {type: 'string', name: 'title', title: 'Title'},
                {
                  type: 'array',
                  name: 'nestedArray',
                  title: 'Nested array',
                  of: [
                    {
                      type: 'object',
                      name: 'level1',
                      title: 'Level 1',
                      fields: [{type: 'string', name: 'title', title: 'Title'}],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

const arrayListOfOptionsExample = {
  type: 'array',
  name: 'arrayListOfOptionsExample',
  title: 'Array (1a)',
  description: 'List of options',
  of: [
    {
      type: 'string',
    },
  ],
  options: {
    list: [
      {value: 'foo', title: 'Foo'},
      {value: 'bar', title: 'Bar'},
      {value: 'baz', title: 'Baz'},
      {value: 'qux', title: 'Qux'},
      {value: 'nux', title: 'Nux'},
    ],
  },
}

const arrayListOfObjectOptionsExample = {
  type: 'array',
  name: 'arrayListOfObjectOptionsExample',
  title: 'Array (1b)',
  description: 'List of options (objects)',
  of: [
    {
      type: 'object',
      fields: [
        {name: 'bodyPart', type: 'string'},
        {name: 'isInternal', type: 'boolean'},
      ],
    },
  ],
  options: {
    list: [
      {value: {bodyPart: 'Head', isInternal: false}, title: 'Head'},
      {value: {bodyPart: 'Foot', isInternal: false}, title: 'Foot'},
      {value: {bodyPart: 'Heart', isInternal: true}, title: 'Heart'},
    ],
  },
}

const arrayListOfReferenceOptionsExample = {
  type: 'array',
  name: 'arrayListOfReferenceOptionsExample',
  title: 'Array (1c)',
  description: 'List of options (references)',
  of: [
    {
      type: 'reference',
      to: [{type: 'author'}],
    },
  ],
  options: {
    list: [
      {value: {_type: 'reference', _ref: 'marius'}, title: 'Marius'},
      {value: {_type: 'reference', _ref: 'espen'}, title: 'Espen'},
    ],
  },
}

const _complexObjectType = {
  type: 'object',
  name: 'complexObject',
  title: 'Complex object',
  fields: [
    {type: 'string', name: 'title', title: 'Title'},
    {
      type: 'reference',
      name: 'author',
      title: 'Author',
      to: [{type: 'author'}],
    },
    {type: 'string', name: 'field2', title: 'Field 2'},
    {type: 'string', name: 'field3', title: 'Field 3'},
    {type: 'string', name: 'field4', title: 'Field 4'},
    {type: 'string', name: 'field5', title: 'Field 5'},
    {type: 'string', name: 'field6', title: 'Field 6'},
    {type: 'string', name: 'field7', title: 'Field 7'},
    {type: 'string', name: 'field8', title: 'Field 8'},
    {type: 'string', name: 'field9', title: 'Field 9'},
    {type: 'string', name: 'field10', title: 'Field 10'},
    {type: 'string', name: 'field11', title: 'Field 11'},
    {type: 'string', name: 'field12', title: 'Field 12'},
    {type: 'string', name: 'field13', title: 'Field 13'},
    {type: 'string', name: 'field14', title: 'Field 14'},
    {type: 'string', name: 'field15', title: 'Field 15'},
    {type: 'string', name: 'field16', title: 'Field 16'},
    {type: 'string', name: 'field17', title: 'Field 17'},
  ],
}

const arrayOfObjectsExample = {
  type: 'array',
  name: 'arrayOfObjectsExample',
  title: 'Array (2)',
  description: 'List of objects',
  of: [_complexObjectType],
  options: {
    editModal: undefined, // 'fullscreen' | 'fold' | 'popover' | undefined
    // sortable: false
  },
}

const arrayOfReferencesExample = {
  type: 'array',
  name: 'arrayOfReferencesExample',
  title: 'Array (3)',
  description: 'List of references',
  of: [
    {
      type: 'reference',
      to: [{type: 'author'}],
    },
  ],
}

const arrayOfStringsExample = {
  type: 'array',
  name: 'arrayOfStringsExample',
  title: 'Array (4a)',
  description: 'List of strings',
  of: [{type: 'string'}],
}

const arrayOfNumbersExample = {
  type: 'array',
  name: 'arrayOfNumbersExample',
  title: 'Array (4b)',
  description: 'List of numbers',
  of: [{type: 'number'}],
}

const arrayOfSlugsExample = {
  type: 'array',
  name: 'arrayOfSlugsExample',
  title: 'Array (4b)',
  description: 'List of slugs',
  of: [{type: 'slug'}],
}

const arrayGridOfFlatImagesExample = {
  type: 'array',
  name: 'arrayGridOfFlatImagesExample',
  title: 'Array (5)',
  description: 'Grid of (flat) images with caption',
  of: [
    {
      type: 'image',
      title: 'Image',
      fields: [
        {
          name: 'caption',
          title: 'Caption',
          type: 'string',
          options: {isHighlighted: true},
          validation: (Rule) => Rule.required().min(10).max(80),
        },
      ],
    },
  ],
  options: {layout: 'grid'},
}

const arrayGridOfImagesExample = {
  type: 'array',
  name: 'arrayGridOfImagesExample',
  title: 'Array (6)',
  description: 'Grid of images',
  of: [
    {
      type: 'object',
      title: 'Image',
      fields: [
        {
          type: 'image',
          name: 'image',
          title: 'Image',
          fields: [
            {
              name: 'caption',
              title: 'Caption',
              type: 'string',
              options: {isHighlighted: true},
              validation: (Rule) => Rule.required().min(10).max(80),
            },
          ],
        },
      ],
      preview: {
        select: {
          media: 'image',
        },
      },
    },
  ],
  options: {
    layout: 'grid',
  },
}

const arrayOfImagesExample = {
  type: 'array',
  name: 'arrayOfImagesExample',
  title: 'Array (7)',
  description: 'List of images',
  of: [
    {
      type: 'object',
      title: 'Image',
      fields: [{type: 'image', name: 'image', title: 'Image'}],
      preview: {
        select: {
          media: 'image',
        },
      },
    },
  ],
  options: {
    // layout: 'list'
  },
}

const arrayOfGeopointsExample = {
  type: 'array',
  name: 'arrayOfGeopointsExample',
  title: 'Array (8)',
  description: 'List of geopoints',
  of: [{type: 'geopoint'}],
}

const booleanExample = {
  type: 'boolean',
  name: 'booleanExample',
  title: 'Boolean example',
}

const booleanCheckboxExample = {
  type: 'boolean',
  name: 'booleanCheckboxExample',
  title: 'Boolean checkbox example',
  options: {
    layout: 'checkbox',
  },
}

const dateExample = {
  type: 'date',
  name: 'dateExample',
  title: 'Date example',
  fieldset: 'dates',
  options: {
    // calendarTodayLabel: 'Today'
  },
}

const datetimeExample = {
  type: 'datetime',
  name: 'datetimeExample',
  title: 'Datetime example',
  fieldset: 'dates',
  options: {
    calendarTodayLabel: 'Now',
  },
}

const fileExample = {
  type: 'file',
  name: 'fileExample',
  title: 'File example',
  fields: [{name: 'vanityFilename', title: 'Vanity filename', type: 'string'}],
}

const geopointExample = {
  type: 'geopoint',
  name: 'geopointExample',
  title: 'Geopoint example',
}

const imageExample = {
  type: 'image',
  name: 'imageExample',
  title: 'Image example',
  options: {
    hotspot: true,
  },
  fields: [
    {
      name: 'caption',
      title: 'Caption',
      type: 'string',
      options: {isHighlighted: true},
      validation: (Rule) => Rule.required().min(10).max(80),
    },
  ],
}

const numberExample = {
  type: 'number',
  name: 'numberExample',
  title: 'Number example',
}

const numberDropdownExample = {
  type: 'number',
  name: 'numberDropdownExample',
  title: 'Number dropdown example',
  options: {
    // layout: 'dropdown',
    list: [1, 2, 3],
  },
}

const numberRadioExample = {
  type: 'number',
  name: 'numberRadioExample',
  title: 'Number radio example',
  options: {
    layout: 'radio',
    list: [1, 2, 3],
  },
}

const objectExample = {
  type: 'object',
  name: 'objectExample',
  title: 'Object (1)',
  fields: [{type: 'string', name: 'title', title: 'Title'}],
}

const objectCollapsibleExample = {
  type: 'object',
  name: 'objectCollapsibleExample',
  title: 'Object (2)',
  description: 'Collapsible object',
  fields: [{type: 'string', name: 'title', title: 'Title'}],
  options: {
    collapsible: true,
  },
}

const objectWithNestedValuesExample = {
  type: 'object',
  name: 'objectWithNestedValues',
  title: 'Object (3)',
  description: 'Nested fields',
  fields: [
    {type: 'string', name: 'title', title: 'Title'},
    {type: 'string', name: 'description', title: 'Description'},
    {
      type: 'object',
      name: 'metadata',
      title: 'Metadata',
      fields: [
        {type: 'string', name: 'title', title: 'Title'},
        {type: 'string', name: 'description', title: 'Description'},
      ],
    },
  ],
}

const portableTextExample = {
  type: 'array',
  name: 'portableTextExample',
  title: 'Portable text',
  of: [{type: 'block', of: [objectExample]}, imageExample, _complexObjectType],
}

const referenceExample = {
  type: 'reference',
  name: 'referenceExample',
  title: 'Reference example',
  to: [{type: 'allInputs'}],
}

const slugExample = {
  type: 'slug',
  name: 'slugExample',
  title: 'Slug example',
  options: {
    source: 'title',
    maxLength: 10,
    // slugify: () => ...
    // isUnique: () => ...
  },
}

const stringExample = {
  type: 'string',
  name: 'stringExample',
  title: 'String example',
}

const stringDropdownExample = {
  type: 'string',
  name: 'stringDropdownExample',
  title: 'String dropdown example',
  options: {
    // layout: 'dropdown',
    list: ['foo', 'bar', 'baz'],
  },
}

const stringRadioExample = {
  type: 'string',
  name: 'stringRadioExample',
  title: 'String radio example',
  options: {
    layout: 'radio',
    list: ['foo', 'bar', 'baz'],
    direction: 'horizontal', // | 'vertical'
  },
}

const textExample = {
  type: 'text',
  name: 'textExample',
  title: 'Text example',
  options: {
    rows: 3,
  },
}

const urlExample = {
  type: 'url',
  name: 'urlExample',
  title: 'URL example',
}

const veryDeepStructure = {
  name: 'deep',
  title: 'Deep',
  type: 'object',
  fields: [
    {
      name: 'deeper',
      type: 'object',
      fields: [
        {
          name: 'evenDeeper',
          type: 'object',
          fields: [
            {
              name: 'deepest',
              type: 'author',
            },
          ],
        },
        {
          name: 'evenDeeperSibling',
          type: 'image',
        },
      ],
    },
    {
      name: 'deeperSibling',
      type: 'string',
    },
  ],
}

export default {
  type: 'document',
  name: 'allInputs',
  title: 'All inputs',
  fieldsets: [{name: 'dates', title: 'Date types'}],
  fields: [
    // metadata
    title,

    referenceExample,

    // array
    arrayOfNestedArrays,
    arrayListOfOptionsExample,
    arrayListOfObjectOptionsExample,
    arrayListOfReferenceOptionsExample,
    arrayOfObjectsExample,
    arrayOfReferencesExample,
    arrayOfStringsExample,
    arrayOfNumbersExample,
    arrayOfSlugsExample,
    arrayGridOfFlatImagesExample,
    arrayGridOfImagesExample,
    arrayOfImagesExample,
    arrayOfGeopointsExample,

    // boolean
    booleanExample,
    booleanCheckboxExample,

    // date
    dateExample,

    // datetime
    datetimeExample,

    // file
    fileExample,

    // geopoint
    geopointExample,

    // image
    imageExample,

    // number
    numberExample,
    numberDropdownExample,
    numberRadioExample,

    // object
    objectExample,
    objectCollapsibleExample,
    objectWithNestedValuesExample,

    // portableText
    portableTextExample,

    // slug
    slugExample,

    // string
    stringExample,
    stringDropdownExample,
    stringRadioExample,

    // text
    textExample,

    // url,
    urlExample,

    // very deep structure
    veryDeepStructure,
  ],
}
