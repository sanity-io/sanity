//import {atLeast, atMost, required} from './sanity/validates'
//import {image, imageVersion, richText} from './sanity/types/bundled'

//

export default {
  types: {
    simple: {
      type: 'object',
      fields: {
        someString: {type: 'string'},
        someNumber: {type: 'number'}
      }
    },
    pets: {
      type: 'array',
      of: [
        {type: 'string', title: 'Pet'}
      ]
    },
    latlon: {
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
    image: {
      type: 'object',
      fields: {
        fullsize: {type: 'string'},
        aspectRatio: {type: 'number'},
        versions: {
          type: 'array',
          of: [{type: 'imageVersion'}]
        }
      }
    },
    imageVersion: {
      type: 'object',
      fields: {
        width: {type: 'number'},
        square: {type: 'boolean'},
        url: {type: 'string'}
      }
    },
    person: {
      type: 'object',
      fields: {
        name: {
          type: 'string',
          title: 'Name'
        },
        contact: {
          type: 'object',
          fields: {
            type: {type: 'string'},
            person: {type: 'reference', to: {type: 'person'}},
            relation: {
              type: 'string',
              placeholder: 'Fetter, mor, etc.'
            }
          }
        }
      }
    },
    client: {
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
          of: [{type: 'string'}, {type: 'number'}] /* note: should fail */
        },
        tags: {
          type: 'tag',
          title: 'Tag',
          placeholder: 'Hva heter kunden?'
        }
      }
    },
    placeholder: {
      type: 'string',
      value: 'placeholder'
    },
    personName: {
      type: 'string',
      autocompletes: {
        scope: 'person'
      }
    },
    something: {
      type: 'any',
      of: [
        {type: 'string'},
        {type: 'person'},
        {
          type: 'reference',
          to: {type: 'person', title: 'Person'},
        },
        {
          type: 'object',
          title: 'Ettellerannet',
          fields: {
            field1: {type: 'string'},
            field2: {type: 'string'}
          }
        },
        {type: 'person'}
      ]
    },
    contentList: {
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'image'}],
          meta: {type: 'imageMetadata'}
        },
        {type: 'tag'},
        {type: 'placeholder'},
        {
          type: 'array',
          of: [{type: 'string'}]
        }
      ],
      validates: {
        maxLength: 4
      }
    },
    tag: {
      type: 'string'
    },
    story: {
      type: 'object',
      fields: {
        pets: {
          title: 'Pets',
          type: 'pets'
        },
        title: {
          type: 'string',
          title: 'Tittel',
          placeholder: 'Slik får du tettere bart enn Poirot'
        },
        ingress: {
          type: 'text',
          title: 'Ingress',
          validates: {
            maxLength: 10
          }
        },
        location: {
          title: 'Where is the bear',
          type: 'latlon'
        },
        image: {
          type: 'image',
          title: 'Image'
        },
        client: {
          type: 'client',
          title: 'Klient'
        },
        content: {
          title: 'Innhold',
          description: 'Innholdet på siden',
          type: 'array',
          of: [
            {type: 'person'}
          ]
        }
      }
    }
  }
}
