/* eslint-disable @typescript-eslint/no-var-requires */
const Icon = () => null

const schema = {
  author: {
    name: 'author',
    title: 'Author',
    type: 'document',
    icon: Icon,
    fields: [],
    initialValue: () => ({
      role: 'Developer'
    })
  },

  post: {
    name: 'post',
    title: 'Post',
    type: 'document',
    icon: Icon,
    fields: []
  }
}

module.exports = {
  getTypeNames: () => Object.keys(schema),
  get: name => schema[name]
}
