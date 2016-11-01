const deepAssign = require('deep-assign')
const assign = require('xtend/mutable')
const validateObject = require('../validators').validateObject

function Patch(selection, operations = {}, client = null) {
  this.selection = selection
  this.operations = assign({}, operations)
  this.client = client
}

assign(Patch.prototype, {
  clone() {
    return new Patch(
      this.selection,
      assign({}, this.operations),
      this.client
    )
  },

  merge(props) {
    validateObject('merge', props)
    return this._assign('merge', deepAssign(this.operations.merge || {}, props))
  },

  set(props) {
    return this._assign('set', props)
  },

  setIfMissing(props) {
    return this._assign('setIfMissing', props)
  },

  replace(props) {
    validateObject('replace', props)
    return this._set('replace', props)
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

    const returnFirst = typeof this.selection === 'string'
    const opts = assign({returnFirst, returnDocuments: true}, options)
    return this.client.mutate({patch: this.serialize()}, opts)
  },

  reset() {
    this.operations = {}
    return this
  },

  _set(op, props) {
    return this._assign(op, props, false)
  },

  _assign(op, props, merge = true) {
    validateObject(op, props)
    this.operations = assign({}, this.operations, {
      [op]: assign({}, (merge && this.operations[op]) || {}, props)
    })
    return this
  }
})

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
