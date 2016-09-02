const deepAssign = require('deep-assign')
const assign = require('xtend/mutable')

function Patch(client, documentId, operations = {}) {
  this.operations = assign({}, operations)
  this.client = client
  this.documentId = documentId
}

assign(Patch.prototype, {
  merge(props) {
    this.operations.merge = deepAssign(this.operations.merge || {}, props)
    return this
  },

  set(props) {
    return this._assign('set', props)
  },

  setIfMissing(props) {
    return this._assign('setIfMissing', props)
  },

  replace(props) {
    this.operations.replace = props
    return this
  },

  inc(props) {
    return this._assign('inc', props)
  },

  dec(props) {
    return this._assign('dec', props)
  },

  // @todo implement when in gradient
  delete(props) {
    throw new Error('Not implemented yet')
  },

  // @todo implement when in gradient
  append(props) {
    throw new Error('Not implemented yet')
  },

  // @todo implement when in gradient
  prepend(props) {
    throw new Error('Not implemented yet')
  },

  // @todo slice? splice? implement when in gradient
  slice(props) {
    throw new Error('Not implemented yet')
  },

  serialize() {
    return assign({id: this.documentId}, this.operations)
  },

  then(...args) {
    return this._commit().then(...args)
  },

  catch(handler) {
    return this._commit().catch(handler)
  },

  _commit() {
    if (!this.documentId) {
      throw new Error('Document ID must be specified to perform patch operations')
    }

    return this.client.mutate({patch: this.serialize()})
  },

  _assign(op, props) {
    const propType = typeof props
    if (propType !== 'object') {
      throw new Error(`${op}() takes an object of properties, received ${propType}`)
    }

    this.operations[op] = assign(this.operations[op] || {}, props)
    return this
  }
})

module.exports = Patch
