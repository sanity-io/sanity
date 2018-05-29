const equals = (itemA, itemB) => Object.keys(itemA).every(key => itemA[key] === itemB[key])

const get = (doc, path, defValue) => {
  const result = path.reduce((item, segment) => {
    if (!item) {
      return item
    }

    if (typeof segment !== 'object') {
      return item[segment]
    }

    return Array.isArray(item) ? item.find(curr => equals(segment, curr)) : undefined
  }, doc)

  return typeof result === 'undefined' ? defValue : result
}

export default {
  name: 'experiment',
  type: 'object',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string'
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: (doc, {parentPath}) => get(doc, parentPath, {}).title
      }
    }
  ]
}
