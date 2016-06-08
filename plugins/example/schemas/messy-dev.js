//import {atLeast, atMost, required} from './sanity/validates'
//import {image, imageVersion, richText} from './sanity/types/bundled'

//

export default {
  name: 'messyDevSchema',
  types: [
    {
      name: 'simple',
      type: 'object',
      fields: [
        {
          name: 'someString',
          type: 'string'
        },
        {
          name: 'home',
          type: 'homeAddress'
        }
      ]
    },
    {
      name: 'homeAddress',
      type: 'object',
      fields: [
        {
          name: 'zip',
          type: 'string'
        }
      ]
    },
    {
      name: 'pets',
      type: 'array',
      of: [
        {
          type: 'string',
          title: 'Pet'
        }
      ]
    },
    {
      name: 'latlon',
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
      type: 'object',
      fields: [
        {
          name: 'fullsize',
          type: 'string'
        },
        {
          name: 'aspectRatio',
          type: 'number'
        },
        {
          name: 'versions',
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
      type: 'object',
      fields: [
        {
          name: 'width',
          type: 'number'
        },
        {
          name: 'square',
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
      type: 'object',
      fields: [
        {
          name: 'name',
          type: 'string',
          title: 'Name'
        },
        {
          name: 'contact',
          type: 'object',
          fields: [
            {
              name: 'type',
              type: 'string'
            },
            {
              name: 'person',
              type: 'reference',
              to: {
                type: 'person'
              }
            },
            {
              name: 'relation',
              type: 'string',
              placeholder: 'Fetter, mor, etc.'
            }
          ]
        }
      ]
    },
    {
      name: 'client',
      type: 'object',
      fields: [
        {
          name: 'somethingInline',
          type: 'object',
          fields: [
            {
              name: 'foo',
              type: 'string'
            }
          ]
        },
        {
          name: 'contactPerson',
          type: 'person',
          title: 'Kontaktperson'
        },
        {
          name: 'name',
          type: 'string',
          title: 'Tittel',
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
      type: 'string',
      autocompletes: {
        scope: 'person'
      }
    },
    {
      name: 'something',
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
