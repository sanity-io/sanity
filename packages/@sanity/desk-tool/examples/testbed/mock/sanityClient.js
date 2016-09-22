import {range} from 'lodash'
import {Patch} from '@sanity/client'

const MOCK_BLOGPOSTS = range(10).map(id => {
  return {
    id: `blogpost:${id}`,
    $id: `blogpost:${id}`,
    $type: 'exampleBlog.blogpost',
    title: `Document ${id}`
  }
})

const MOCK_AUTHORS = range(10).map(id => {
  return {
    id: `author:${id}`,
    $id: `author:${id}`,
    $type: 'exampleBlog.author',
    title: `Author ${id}`
  }
})

const indexes = Object.assign(Object.create(null), {blogpost: MOCK_BLOGPOSTS, author: MOCK_AUTHORS})

function getIndexForType(type) {
  if (!(type in indexes)) {
    throw new Error(`Invalid type: ${type}`)
  }
  return indexes[type]
}

export default {
  data: {
    fetch(query) {
      const [, type] = query.split(' ')[0].split('.')
      return Promise.resolve(getIndexForType(type))
    },
    getDocument(id) {
      const index = getIndexForType(id.split(':')[0])
      return Promise.resolve(index.find(doc => doc.id === id))
    },
    create(doc) {
      const index = getIndexForType(doc.$type)
      const newLen = index.push(doc)
      doc.id = doc.$id = `${doc.$type}:${newLen}`
      return Promise.resolve({documentId: doc.id})
    },
    patch(id) {
      return new Patch(id, {}, this)
    },
    mutate(spec) {
      return Promise.resolve()
    }
  }
}
