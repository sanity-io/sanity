import singletonStructure from './singletonStructure'

export default Object.assign({}, singletonStructure, {
  resolveChildForItem: id =>
    new Promise(resolve =>
      setImmediate(resolve, {
        type: 'document',
        options: {id, type: 'someType'}
      })
    )
})
