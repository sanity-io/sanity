//import {atLeast, atMost, required} from './sanity/validates'
//import {image, imageVersion, richText} from './sanity/types/bundled'

export default {
  latlon: {
    is: 'object',
    fields: {
      lat: {
        title: 'Latitude',
        fieldType: 'number'
      },
      lon: {
        title: 'Longitude',
        fieldType: 'number'
      }
    }
  },
  relation: {
    is: 'object',
    fields: {
      meta: {
        fieldType: 'object'
      }
    }
  },
  image: {
    is: 'object',
    fields: {
      fullsize: {fieldType: 'string'},
      aspectRatio: {fieldType: 'number'},
      versions: {
        fieldType: 'list',
        of: [{fieldType: 'imageVersion'}]
      }
    }
  },
  imageVersion: {
    is: 'object',
    fields: {
      width: {fieldType: 'number'},
      square: {fieldType: 'boolean'},
      url: {fieldType: 'string'}
    }
  },
  person: {
    is: 'object',
    fields: {
      name: {
        fieldType: 'string',
        title: 'Name'
      }
    }
  },
  client: {
    is: 'object',
    fields: {
      contactPerson: {
        fieldType: 'person',
        title: 'Kontakt person'
      },
      name: {
        fieldType: 'string',
        title: 'Tittel',
        placeholder: 'Hva heter kunden?'
      },
      names: {
        title: 'Names',
        fieldType: 'list',
        of: [{fieldType: 'string'}]
      },
      tags: {
        fieldType: 'tag',
        title: 'Tag',
        placeholder: 'Hva heter kunden?'
      }
    }
  },
  personName: {
    is: 'string',
    autocompletes: {
      scope: 'person'
    }
  },
  contentList: {
    is: 'list',
    of: [
      {
        fieldType: 'reference',
        to: [{fieldType: 'image'}],
        meta: {fieldType: 'imageMetadata'}
      },
      {fieldType: 'tag'},
      {fieldType: 'placeholder'},
      {
        fieldType: 'list',
        of: [{fieldType: 'string'}]
      }
    ],
    validates: {
      maxLength: 4
    }
  },
  story: {
    is: 'object',
    name: 'story',
    fields: {
      title: {
        fieldType: 'string',
        title: 'Tittel',
        placeholder: 'Slik får du tettere bart enn Poirot'
      },
      ingress: {
        fieldType: 'richText',
        title: 'Ingress',
        validates: {
          maxLen: 10
        }
      },
      location: {
        title: 'Where is the bear',
        fieldType: 'latlon'
      },
      image: {
        fieldType: 'image',
        title: 'Image'
      },
      client: {
        fieldType: 'client',
        title: 'Klient'
      },
      content: {
        title: 'Innhold',
        description: 'Innholdet på siden',
        fieldType: 'list',
        of: [
          {fieldType: 'person'}
        ]
      }
    }
  }
}
