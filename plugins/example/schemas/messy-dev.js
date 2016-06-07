//import {atLeast, atMost, required} from './sanity/validates'
//import {image, imageVersion, richText} from './sanity/types/bundled'

//

export default {
  name: 'messyDevSchema',
  types: [
    {
      name: 'simple',
      type: 'object',
      fields: {
        someString: {
          type: 'string'
        },
        home: {
          type: 'homeAddress'
        }
      }
    },
    {
      name: 'homeAddress',
      type: 'object',
      fields: {
        zip: {
          type: 'string'
        }
      }
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
      fields: {
        lat: {
          title: 'Latitude',
          type: 'number'
        },
        lon: {
          title: 'Longitude',
          type: 'number'
        }
      }
    },
    {
      name: 'image',
      type: 'object',
      fields: {
        fullsize: {
          type: 'string'
        },
        aspectRatio: {
          type: 'number'
        },
        versions: {
          type: 'array',
          of: [
            {
              type: 'imageVersion'
            }
          ]
        }
      }
    },
    {
      name: 'imageVersion',
      type: 'object',
      fields: {
        width: {
          type: 'number'
        },
        square: {
          type: 'boolean'
        },
        url: {
          type: 'string'
        }
      }
    },
    {
      name: 'person',
      type: 'object',
      fields: {
        name: {
          type: 'string',
          title: 'Name'
        },
        contact: {
          type: 'object',
          fields: {
            type: {
              type: 'string'
            },
            person: {
              type: 'reference',
              to: {
                type: 'person'
              }
            },
            relation: {
              type: 'string',
              placeholder: 'Fetter, mor, etc.'
            }
          }
        }
      }
    },
    {
      name: 'client',
      type: 'object',
      fields: {
        somethingInline: {
          type: 'object',
          fields: {
            foo: {
              type: 'string'
            }
          }
        },
        contactPerson: {
          type: 'person',
          title: 'Kontaktperson'
        },
        name: {
          type: 'string',
          title: 'Tittel',
          placeholder: 'Hva heter kunden?'
        },
        names: {
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
        tags: {
          type: 'tag',
          title: 'Tag',
          placeholder: 'Hva heter kunden?'
        }
      }
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
