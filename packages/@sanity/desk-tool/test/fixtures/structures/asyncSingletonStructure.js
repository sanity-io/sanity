import singletonStructure from './singletonStructure'

export default Object.assign({}, singletonStructure, {
  resolveChildForItem: (id) =>
    new Promise((resolve) =>
      setTimeout(resolve, 25, {
        type: 'document',
        options: {id, type: 'someType'},
      })
    ),
})
