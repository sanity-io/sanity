import {range} from 'lodash'
import {Patch} from '@sanity/client'

function generateId(n) {
  return ((n + 1) / 1.1111111111111).toString(32).substring(2)
}

function createDoc(_type, fields) {
  return Object.assign({_type}, fields)
}
function createBlogPost(n) {
  return createDoc('exampleBlog.blogpost', {
    title: `Blogpost ${n}`
  })
}
function createAuthor(n) {
  return createDoc('exampleBlog.author', {
    name: `Author ${n}`
  })
}

const PATCH_TYPES = {
  set(doc, patch) {
    return Object.assign({}, doc, patch)
  }
}

function createDB() {
  const docs = []
  const index = {}
  return {
    create,
    getById,
    getAll() {
      return docs.slice()
    },
    patch(patch) {
      if (!patch.id) {
        throw new Error(`Missing document id for patch ${JSON.stringify(patch)}`)
      }
      const {id, ...rest} = patch
      const idx = indexOf(id)
      const currentDoc = docs[idx]
      const nextDoc = Object.keys(rest).reduce((doc, patchType) => {
        if (!PATCH_TYPES.hasOwnProperty(patchType)) {
          throw new Error(
            `Invalid patchType: ${patchType} (Only [${Object.keys(PATCH_TYPES).join(', ')}] is supported by mock sanity client for now)`
          )
        }
        return PATCH_TYPES[patchType](doc, patch[patchType])
      }, currentDoc)
      update(nextDoc._id, nextDoc)
    }
  }
  function indexOf(id) {
    return index[id]
  }
  function update(_id, document) {
    const idx = indexOf(_id)
    docs[idx] = document
  }
  function getById(id) {
    return docs[indexOf(id)]
  }
  function create(doc) {
    if (doc._id) {
      throw new Error('Cannot create document with an id')
    }
    const nextIdx = docs.length
    const _id = `public/${generateId(nextIdx)}`
    const storedDoc = Object.assign({}, doc, {_id})
    docs.push(storedDoc)
    index[_id] = nextIdx
    return storedDoc
  }
}

const DB = createDB()
range(5)
  .map(createAuthor)
  .map(DB.create)

range(20)
  .map(createBlogPost)
  .map(DB.create)

export default {
  fetch(query) {
    const [type] = query.split(' ')
    return Promise.resolve(DB.getAll().filter(doc => doc._type === type))
  },
  getDocument(id) {
    return Promise.resolve(DB.getById(id))
  },
  create(doc) {
    return Promise.resolve({documentId: DB.create(doc)._id})
  },
  patch(id) {
    return new Patch(id, {}, this)
  },
  mutate(spec) {
    return Promise.resolve(DB.patch(spec.patch))
  }
}
