//import {atLeast, atMost, required} from './sanity/validates'
//import {image, imageVersion, richText} from './sanity/types/bundled'

//

export default {
  itemz: {
    type: 'list',
    of: [
      {type: 'latlon'}
    ]
  },
  latlon: {
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
    fields: {
      width: {type: 'number'},
      square: {type: 'boolean'},
      url: {type: 'string'}
    }
  },
  person: {
    fields: {
      name: {
        type: 'string',
        title: 'Name'
      }
    }
  },
  client: {
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
    type: 'string',
    autocompletes: {
      scope: 'person'
    }
  },
  contentList: {
    type: 'list',
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
        type: 'list',
        of: [
          {type: 'person'}
        ]
      },
      shrooms: {
        title: 'Yummy shrooms',
        type: 'itemz'
      }
    }
  }
}
