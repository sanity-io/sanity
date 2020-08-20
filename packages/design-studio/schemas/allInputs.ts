const title = {
  type: 'string',
  name: 'title',
  title: 'Title'
}

// example fields

const arrayOfObjects = {
  type: 'array',
  name: 'arrayOfObjects',
  title: 'Array of objects',
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

const arrayOfReferences = {
  type: 'array',
  name: 'arrayOfReferences',
  title: 'Array of references',
  of: [
    {
      type: 'reference',
      to: [{type: 'author'}]
    }
  ]
}

const arrayOfPrimitives = {
  type: 'array',
  name: 'arrayOfPrimitives',
  title: 'Array of primitives',
  of: [{type: 'string'}]
}

const arrayOfGeopoints = {
  type: 'array',
  name: 'arrayOfGeopoints',
  title: 'Array of geopoints',
  of: [{type: 'geopoint'}]
}

const booleanExample = {
  type: 'boolean',
  name: 'booleanExample',
  title: 'Boolean example'
}

const arrayGridOfFlatImages = {
  type: 'array',
  name: 'arrayGridOfFlatImages',
  title: 'Array grid of (flat) images with caption',
  of: [
    {
      type: 'image',
      fields: [{name: 'caption', title: 'Caption', type: 'string', options: {isHighlighted: true}}]
    }
  ],
  options: {layout: 'grid'}
}

const arrayGridOfImages = {
  type: 'array',
  name: 'arrayGridOfImages',
  title: 'Array grid of images',
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
  title: 'File example'
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

const object = {
  type: 'object',
  name: 'object',
  title: 'Object',
  fields: [{type: 'string', name: 'title', title: 'Title'}]
}

const objectWithNestedValues = {
  type: 'object',
  name: 'objectWithNestedValues',
  title: 'Object with nested values',
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

const portableText = {
  type: 'array',
  name: 'portableText',
  title: 'Portable text',
  of: [{type: 'block'}]
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
    arrayOfObjects,
    arrayOfReferences,
    arrayOfPrimitives,
    arrayGridOfImages,
    arrayGridOfFlatImages,
    arrayOfGeopoints,

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
    object,
    objectWithNestedValues,

    // portableText
    portableText,

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
