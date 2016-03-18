//import {atLeast, atMost, required} from './sanity/validates'
//import {image, imageVersion, richText} from './sanity/types/bundled'

export default {
  latlon: {
    is: 'object',
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
  relation: {
    is: 'object',
    fields: {
      meta: {
        type: 'object'
      }
    }
  },
  image: {
    is: 'object',
    fields: {
      fullsize: {type: 'string'},
      aspectRatio: {type: 'number'},
      versions: {
        type: 'list',
        of: [{type: 'imageVersion'}]
      }
    }
  },
  imageVersion: {
    is: 'object',
    fields: {
      width: {type: 'number'},
      square: {type: 'boolean'},
      url: {type: 'string'}
    }
  },
  person: {
    is: 'object',
    fields: {
      name: {
        type: 'string',
        title: 'Name'
      }
    }
  },
  client: {
    is: 'object',
    fields: {
      contactPerson: {
        type: 'person',
        title: 'Kontakt person'
      },
      name: {
        type: 'string',
        title: 'Tittel',
        placeholder: 'Hva heter kunden?'
      },
      names: {
        title: 'Names',
        type: 'list',
        of: [{type: 'string'}]
      },
      tags: {
        type: 'tag',
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
        type: 'reference',
        to: [{type: 'image'}],
        meta: {type: 'imageMetadata'}
      },
      {type: 'tag'},
      {type: 'placeholder'},
      {
        type: 'list',
        of: [{type: 'string'}]
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
        type: 'string',
        title: 'Tittel',
        placeholder: 'Slik får du tettere bart enn Poirot'
      },
      ingress: {
        type: 'richText',
        title: 'Ingress',
        validates: {
          maxLen: 10
        }
      },
      location: {
        type: {
          is: 'object',
          fields: {
            lat: {type: 'string'}
          }
        }
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
        type: {
          is: 'list',
          of: [/*...*/]
        }
      }
    }
  }
}
