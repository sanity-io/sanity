const singletonStructure = require('./singletonStructure')

module.exports = Object.assign({}, singletonStructure, {
  resolveChildForItem: id =>
    new Promise(resolve =>
      setImmediate(resolve, {
        type: 'document',
        options: {id, type: 'someType'}
      })
    )
})
