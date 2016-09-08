const deepAssign = require('deep-assign')
const assign = require('xtend/mutable')
const validateObject = require('../validators').validateObject

function Patch(documentId, operations = {}, client = null) {
  this.documentId = documentId
  this.operations = assign({}, operations)
  this.client = client
}

assign(Patch.prototype, {
  clone(addOps = {}) {
    return new Patch(
      this.documentId,
      assign({}, this.operations, addOps),
      this.client
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
  unset(props) {
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

  // @todo implement when in gradient
  splice(props) {
    throw new Error('Not implemented yet')
  },

  serialize() {
    return assign({id: this.documentId}, this.operations)
  },

  toJSON() {
    return this.serialize()
  },

  commit() {
    if (this.client) {
      return this.client.mutate({patch: this.serialize()})
    }

    throw new Error(
      'No `client` passed to patch, either provide one or pass the '
      + 'patch to a clients `data.mutate()` method'
    )
  },

  reset() {
    return new Patch(this.documentId, {}, this.client)
  },

  _assign(op, props) {
    validateObject(op, props)
    return this.clone({[op]: assign({}, this.operations[op] || {}, props)})
  },

  then: throwPromiseError('then'),
  catch: throwPromiseError('catch')
})

function throwPromiseError(op) {
  return () => {
    throw new Error(`${op}() called on an uncommited patch, did you forget to call commit()?`)
  }
}

module.exports = Patch
