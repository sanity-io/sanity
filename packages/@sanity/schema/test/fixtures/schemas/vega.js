//import {atLeast, atMost, required} from './sanity/validates'
//import {image, imageVersion, richText} from './sanity/types/bundled'

//

export default {
  name: 'vega',
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
          name: 'someNumber',
          type: 'number'
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
        },
        {
          type: 'object',
          title: 'Ettellerannet',
          fields: [
            {
              name: 'field1',
              type: 'string'
            },
            {
              name: 'field2',
              type: 'string'
            }
          ]
        },
        {
          type: 'person'
        }
      ]
    },
    {
      name: 'contentList',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [
            {
              type: 'image'
            }
          ],
          meta: {
            type: 'imageMetadata'
          }
        },
        {
          type: 'tag'
        },
        {
          type: 'placeholder'
        },
        {
          type: 'array',
          of: [
            {
              type: 'string'
            }
          ]
        }
      ],
      validates: {
        maxLength: 4
      }
    },
    {
      name: 'tag',
      type: 'string'
    },
    {
      name: 'story',
      type: 'object',
      fields: [
        {
          name: 'title',
          type: 'string',
          title: 'Tittel',
          placeholder: 'Slik får du tettere bart enn Poirot'
        },
        {
          name: 'ingress',
          type: 'text',
          format: 'html',
          title: 'Ingress',
          validates: {
            maxLength: 10
          }
        },
        {
          name: 'location',
          title: 'Where is the bear',
          type: 'latlon'
        },
        {
          name: 'image',
          type: 'image',
          title: 'Image'
        },
        {
          name: 'client',
          type: 'client',
          title: 'Klient'
        },
        {
          name: 'content',
          title: 'Innhold',
          description: 'Innholdet på siden',
          type: 'array',
          of: [
            {
              type: 'person'
            }
          ]
        }
      ]
    }
  ]
}
