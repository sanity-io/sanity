const deepAssign = require('deep-assign')
const assign = require('xtend/mutable')
const validateObject = require('../validators').validateObject

function Patch(selection, operations = {}, client = null) {
  this.selection = selection
  this.operations = assign({}, operations)
  this.client = client
}

assign(Patch.prototype, {
  clone(addOps = {}) {
    return new Patch(
      this.selection,
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
    return assign(getSelection(this.selection), this.operations)
  },

  toJSON() {
    return this.serialize()
  },

  commit(options = {}) {
    if (!this.client) {
      throw new Error(
        'No `client` passed to patch, either provide one or pass the '
        + 'patch to a clients `mutate()` method'
      )
    }

    return this.client.mutate({patch: this.serialize()}, options)
  },

  reset() {
    return new Patch(this.selection, {}, this.client)
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

function getSelection(sel) {
  if (typeof sel === 'string' || Array.isArray(sel)) {
    return {id: sel}
  }

  if (sel && sel.query) {
    return {query: sel.query}
  }

  const selectionOpts = [
    '* Dataset-prefixed document ID (<dataset/docId>)',
    '* Array of dataset-prefixed document IDs',
    '* Object containing `query`'
  ].join('\n')

  throw new Error(`Unknown selection for patch - must be one of:\n\n${selectionOpts}`)
}

module.exports = Patch
