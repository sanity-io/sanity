const deepAssign = require('deep-assign')
const assign = require('xtend/mutable')

function Patch(client, documentId, operations = {}) {
  this.operations = assign({}, operations)
  this.client = client
  this.documentId = documentId
}

assign(Patch.prototype, {
  clone(addOps = {}) {
    return new Patch(
      this.client,
      this.documentId,
      assign({}, this.operations, addOps)
    )
  },

  merge(props) {
    validateObject('merge', props)
    return this.clone({merge: deepAssign(this.operations.merge || {}, props)})
  },

  set(props) {
    return this._assign('set', props)
  },

  setIfMissing(props) {
    return this._assign('setIfMissing', props)
  },

  replace(props) {
    validateObject('replace', props)
    return this.clone({replace: props})
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

  commit() {
    return this.client.mutate({patch: this.serialize()})
  },

  reset() {
    return new Patch(this.client, this.documentId)
  },

  _assign(op, props) {
    validateObject(op, props)
    return this.clone({[op]: assign({}, this.operations[op] || {}, props)})
  }
})

function validateObject(op, val) {
  if (val === null || typeof val !== 'object' || Array.isArray(val)) {
    throw new Error(`${op}() takes an object of properties`)
  }
}

module.exports = Patch
