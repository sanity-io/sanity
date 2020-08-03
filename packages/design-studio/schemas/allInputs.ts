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

const slugExample = {
  type: 'slug',
  name: 'slugExample',
  title: 'Slug example',
  options: {
    source: 'stringExample',
    maxLength: 10
    // slugify: () => ...
    // isUnique: () => ...
  }
}

const dateExample = {
  type: 'date',
  name: 'dateExample',
  title: 'Date example',
  options: {
    // calendarTodayLabel: 'Today'
  }
}

const datetimeExample = {
  type: 'datetime',
  name: 'datetimeExample',
  title: 'Datetime example',
  options: {
    calendarTodayLabel: 'Now'
  }
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

const fileExample = {
  type: 'file',
  name: 'fileExample',
  title: 'File example'
}

const imageExample = {
  type: 'image',
  name: 'imageExample',
  title: 'Image example',
  options: {
    hotspot: true
  }
}

const geopointExample = {
  type: 'geopoint',
  name: 'geopointExample',
  title: 'Geopoint example'
}

const referenceExample = {
  type: 'reference',
  name: 'referenceExample',
  title: 'Reference example',
  to: [{type: 'allInputs'}]
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
  fields: [
    // @todo: array
    // @todo: array[block[span]]

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

    // @todo: object

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
