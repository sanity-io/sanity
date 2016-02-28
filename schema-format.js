//import {atLeast, atMost, required} from './sanity/validations'
//import {image, imageVersion, richText} from './sanity/types/bundled'

const types = [
  {
    name: 'string',
    isPrimitive: true
  },
  {
    name: 'boolean',
    isPrimitive: true
  },
  {
    name: 'number',
    isPrimitive: true
  },
  {
    name: 'list',
    isPrimitive: true
  },
  {
    name: 'reference',
    isPrimitive: true
  },
  {
    name: 'image',
    isPrimitive: true
  },
  {
    name: 'imageVersion',
    fields: {
      width: {type: 'number'},
      square: {type: 'boolean'},
      url: {type: 'string'}
    }
  },
  {
    name: 'image',
    fields: {
      fullsize: {type: 'string'},
      aspectRatio: {type: 'number'},
      versions: {
        type: 'list',
        of: [{type: 'imageVersion'}]
      }
    }
  },
  {name: 'richText', alias: 'string'},
  {name: 'person', alias: 'string'},
  {name: 'placeholder', alias: 'string'},
  {name: 'tag', alias: 'string'},
  {
    name: 'client',
    fields: {
      name: {
        type: 'string',
        title: 'Tittel',
        placeholder: 'Hva heter kunden?'
      },
      names: {
        type: 'list',
        title: 'Names',
        of: [{type: 'string'}]
      },
      tags: {
        type: 'tag',
        title: 'Tag',
        placeholder: 'Hva heter kunden?'
      }
    }
  },
  {
    name: 'story',
    fields: {
      title: {
        type: 'string',
        title: 'Tittel',
        placeholder: 'Slik får du tettere bart enn Poirot'
      },
      ingress: {
        type: 'richText',
        title: 'Ingress'
      },
      image: {
        type: 'image',
        title: 'Image'
      },
      client: {
        type: 'client',
        title: 'Klient'
      },
      mainImages: {
        title: 'Hovedbilder',
        description: 'Ett eller flere bilder som egner som til å fylle skjermen. NB: Kun første bilde vises foreløpig.',
        type: 'list',
        of: [
          {
            type: 'reference',
            to: [{type: 'image'}],
            meta: 'imageMetadata'
          },
          {type: 'tag'},
          {type: 'placeholder'},
          {
            type: 'list',
            of: [{type: 'string'}]
          }
        ]
      }
    }
  }
]

export default types
