const title = {
  type: 'string',
  name: 'title',
  title: 'Title'
}

// example fields

const arrayListOfOptionsExample = {
  type: 'array',
  name: 'arrayListOfOptionsExample',
  title: 'Array (1)',
  description: 'List of options',
  of: [
    {
      type: 'string'
    }
  ],
  options: {
    list: [
      {value: 'foo', title: 'Foo'},
      {value: 'bar', title: 'Bar'},
      {value: 'baz', title: 'Baz'},
      {value: 'qux', title: 'Qux'},
      {value: 'nux', title: 'Nux'}
    ]
  }
}

const arrayOfObjectsExample = {
  type: 'array',
  name: 'arrayOfObjectsExample',
  title: 'Array (2)',
  description: 'List of objects',
  of: [
    {
      type: 'object',
      title: 'Item',
      fields: [{type: 'string', name: 'title', title: 'Title'}]
    }
  ],
  options: {
    // sortable: false
  }
}

const arrayOfReferencesExample = {
  type: 'array',
  name: 'arrayOfReferencesExample',
  title: 'Array (3)',
  description: 'List of references',
  of: [
    {
      type: 'reference',
      to: [{type: 'author'}]
    }
  ]
}

const arrayOfPrimitivesExample = {
  type: 'array',
  name: 'arrayOfPrimitivesExample',
  title: 'Array (4)',
  description: 'List of primitives',
  of: [{type: 'string'}]
}

const arrayGridOfFlatImagesExample = {
  type: 'array',
  name: 'arrayGridOfFlatImagesExample',
  title: 'Array (5)',
  description: 'Grid of (flat) images with caption',
  of: [
    {
      type: 'image',
      fields: [{name: 'caption', title: 'Caption', type: 'string', options: {isHighlighted: true}}]
    }
  ],
  options: {layout: 'grid'}
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
      fields: [{type: 'image', name: 'image', title: 'Image'}],
      preview: {
        select: {
          media: 'image'
        }
      }
    }
  ],
  options: {
    layout: 'grid'
  }
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
          media: 'image'
        }
      }
    }
  ],
  options: {
    // layout: 'list'
  }
}

const arrayOfGeopointsExample = {
  type: 'array',
  name: 'arrayOfGeopointsExample',
  title: 'Array (8)',
  description: 'List of geopoints',
  of: [{type: 'geopoint'}]
}

const booleanExample = {
  type: 'boolean',
  name: 'booleanExample',
  title: 'Boolean example'
}

const booleanCheckboxExample = {
  type: 'boolean',
  name: 'booleanCheckboxExample',
  title: 'Boolean checkbox example',
  options: {
    layout: 'checkbox'
  }
}

const dateExample = {
  type: 'date',
  name: 'dateExample',
  title: 'Date example',
  fieldset: 'dates',
  options: {
    // calendarTodayLabel: 'Today'
  }
}

const datetimeExample = {
  type: 'datetime',
  name: 'datetimeExample',
  title: 'Datetime example',
  fieldset: 'dates',
  options: {
    calendarTodayLabel: 'Now'
  }
}

const fileExample = {
  type: 'file',
  name: 'fileExample',
  title: 'File example',
  fields: [{name: 'vanityFilename', title: 'Vanity filename', type: 'string'}]
}

const geopointExample = {
  type: 'geopoint',
  name: 'geopointExample',
  title: 'Geopoint example'
}

const imageExample = {
  type: 'image',
  name: 'imageExample',
  title: 'Image example',
  options: {
    hotspot: true
  }
}

const numberExample = {
  type: 'number',
  name: 'numberExample',
  title: 'Number example'
}

const numberDropdownExample = {
  type: 'number',
  name: 'numberDropdownExample',
  title: 'Number dropdown example',
  options: {
    // layout: 'dropdown',
    list: [1, 2, 3]
  }
}

const numberRadioExample = {
  type: 'number',
  name: 'numberRadioExample',
  title: 'Number radio example',
  options: {
    layout: 'radio',
    list: [1, 2, 3]
  }
}

const objectExample = {
  type: 'object',
  name: 'objectExample',
  title: 'Object (1)',
  fields: [{type: 'string', name: 'title', title: 'Title'}]
}

const objectCollapsibleExample = {
  type: 'object',
  name: 'objectCollapsibleExample',
  title: 'Object (2)',
  description: 'Collapsible object',
  fields: [{type: 'string', name: 'title', title: 'Title'}],
  options: {
    collapsible: true
  }
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
        {type: 'string', name: 'description', title: 'Description'}
      ]
    }
  ]
}

const portableTextExample = {
  type: 'array',
  name: 'portableTextExample',
  title: 'Portable text',
  of: [{type: 'block', of: [objectExample]}, imageExample]
}

const referenceExample = {
  type: 'reference',
  name: 'referenceExample',
  title: 'Reference example',
  to: [{type: 'allInputs'}]
}

const slugExample = {
  type: 'slug',
  name: 'slugExample',
  title: 'Slug example',
  options: {
    source: 'title',
    maxLength: 10
    // slugify: () => ...
    // isUnique: () => ...
  }
}

const stringExample = {
  type: 'string',
  name: 'stringExample',
  title: 'String example'
}

const stringDropdownExample = {
  type: 'string',
  name: 'stringDropdownExample',
  title: 'String dropdown example',
  options: {
    // layout: 'dropdown',
    list: ['foo', 'bar', 'baz']
  }
}

const stringRadioExample = {
  type: 'string',
  name: 'stringRadioExample',
  title: 'String radio example',
  options: {
    layout: 'radio',
    list: ['foo', 'bar', 'baz'],
    direction: 'horizontal' // | 'vertical'
  }
}

const textExample = {
  type: 'text',
  name: 'textExample',
  title: 'Text example',
  options: {
    rows: 3
  }
}

const urlExample = {
  type: 'url',
  name: 'urlExample',
  title: 'URL example'
}

export default {
  type: 'document',
  name: 'allInputs',
  title: 'All inputs',
  fieldsets: [{name: 'dates', title: 'Date types'}],
  fields: [
    // metadata
    title,

    // array
    arrayListOfOptionsExample,
    arrayOfObjectsExample,
    arrayOfReferencesExample,
    arrayOfPrimitivesExample,
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

    // reference
    referenceExample,

    // slug
    slugExample,

    // string
    stringExample,
    stringDropdownExample,
    stringRadioExample,

    // text
    textExample,

    // url,
    urlExample
  ]
}
