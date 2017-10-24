//import {atLeast, atMost, required} from './sanity/validates'
//import {image, imageVersion, richText} from './sanity/types/bundled'

//

export default {
  name: 'messyDevSchema',
  types: [
    {
      name: 'simple',
      title: 'Simple',
      type: 'object',
      fields: [
        {
          name: 'someString',
          title: 'Some string',
          type: 'string'
        },
        {
          name: 'home',
          title: 'Home address',
          type: 'homeAddress'
        }
      ]
    },
    {
      name: 'homeAddress',
      title: 'Home address',
      type: 'object',
      fields: [
        {
          name: 'zip',
          title: 'Zip code',
          type: 'string'
        }
      ]
    },
    {
      name: 'latlon',
      title: 'Latlong',
      type: 'object',
      fields: [
        {
          name: 'lat',
          title: 'Latitude',
          type: 'number'
        },
        {
          name: 'lon',
          title: 'Longitude',
          type: 'number'
        }
      ]
    },
    {
      name: 'image',
      title: 'Image',
      type: 'object',
      fields: [
        {
          name: 'fullsize',
          title: 'Full size',
          type: 'string'
        },
        {
          name: 'aspectRatio',
          title: 'Aspect ratio',
          type: 'number'
        },
        {
          name: 'versions',
          title: 'Versions',
          type: 'array',
          of: [
            {
              type: 'imageVersion'
            }
          ]
        }
      ]
    },
    {
      name: 'imageVersion',
      title: 'Image version',
      type: 'object',
      fields: [
        {
          name: 'width',
          title: 'Width',
          type: 'number'
        },
        {
          name: 'square',
          title: 'Square',
          type: 'boolean'
        },
        {
          name: 'url',
          type: 'string'
        }
      ]
    },
    {
      name: 'person',
      title: 'Person',
      type: 'object',
      fields: [
        {
          name: 'name',
          type: 'string',
          title: 'Name'
        },
        {
          name: 'contact',
          title: 'Contact',
          type: 'object',
          fields: [
            {
              name: 'type',
              title: 'Type',
              type: 'string'
            },
            {
              name: 'person',
              title: 'Person reference',
              type: 'reference',
              to: {
                type: 'person'
              }
            },
            {
              name: 'relation',
              title: 'Relation string',
              type: 'string',
              placeholder: 'Fetter, mor, etc.'
            }
          ]
        }
      ]
    },
    {
      name: 'client',
      title: 'Client',
      type: 'object',
      fields: [
        {
          name: 'somethingInline',
          title: 'Something inline',
          type: 'object',
          fields: [
            {
              name: 'foo',
              title: 'Foo string',
              type: 'string'
            }
          ]
        },
        {
          name: 'contactPerson',
          title: 'Contact Person',
          type: 'person'
        },
        {
          name: 'name',
          type: 'string',
          title: 'Name',
          placeholder: 'Hva heter kunden?'
        },
        {
          name: 'names',
          title: 'Names',
          type: 'array',
          of: [
            {
              type: 'string'
            },
            {
              type: 'number'
            }
          ]
        },
        {
          name: 'tags',
          type: 'tag',
          title: 'Tag',
          placeholder: 'Hva heter kunden?'
        }
      ]
    },
    {
      name: 'tag',
      type: 'string'
    },
    {
      name: 'placeholder',
      type: 'string',
      value: 'placeholder'
    },
    {
      name: 'personName',
      title: 'Autocomplete person (legacy)',
      type: 'string',
      autocompletes: {
        scope: 'person'
      }
    },
    {
      name: 'something',
      title: 'Something any',
      type: 'any',
      of: [
        {
          type: 'string'
        },
        {
          type: 'person'
        },
        {
          type: 'reference',
          to: {
            type: 'person',
            title: 'Person'
          }
        }
      ]
    }
  ]
}
