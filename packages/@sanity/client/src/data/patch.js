const deepAssign = require('deep-assign')
const assign = require('object-assign')
const getSelection = require('../util/getSelection')
const validate = require('../validators')
const validateObject = validate.validateObject
const validateInsert = validate.validateInsert

function Patch(selection, operations = {}, client = null) {
  this.selection = selection
  this.operations = assign({}, operations)
  this.client = client
}

assign(Patch.prototype, {
  clone() {
    return new Patch(this.selection, assign({}, this.operations), this.client)
  },

  merge(props) {
    validateObject('merge', props)

    const stack = new Error().stack
      .toString()
      .split('\n')
      .filter((str) => str.trim())
      .slice(2)

    console.warn(
      `The "merge" patch has been deprecated and will be removed in the future\n${stack.join('\n')}`
    )
    return this._assign('merge', deepAssign(this.operations.merge || {}, props))
  },

  set(props) {
    return this._assign('set', props)
  },

  diffMatchPatch(props) {
    validateObject('diffMatchPatch', props)
    return this._assign('diffMatchPatch', props)
  },

  unset(attrs) {
    if (!Array.isArray(attrs)) {
      throw new Error('unset(attrs) takes an array of attributes to unset, non-array given')
    }

    this.operations = assign({}, this.operations, {unset: attrs})
    return this
  },

  setIfMissing(props) {
    return this._assign('setIfMissing', props)
  },

  replace(props) {
    validateObject('replace', props)
    return this._set('set', {$: props}) // eslint-disable-line id-length
  },

  inc(props) {
    return this._assign('inc', props)
  },

  dec(props) {
    return this._assign('dec', props)
  },

  insert(at, selector, items) {
    validateInsert(at, selector, items)
    return this._assign('insert', {[at]: selector, items})
  },

  append(selector, items) {
    return this.insert('after', `${selector}[-1]`, items)
  },

  prepend(selector, items) {
    return this.insert('before', `${selector}[0]`, items)
  },

  splice(selector, start, deleteCount, items) {
    // Negative indexes doesn't mean the same in Sanity as they do in JS;
    // -1 means "actually at the end of the array", which allows inserting
    // at the end of the array without knowing its length. We therefore have
    // to substract negative indexes by one to match JS. If you want Sanity-
    // behaviour, just use `insert('replace', selector, items)` directly
    const delAll = typeof deleteCount === 'undefined' || deleteCount === -1
    const startIndex = start < 0 ? start - 1 : start
    const delCount = delAll ? -1 : Math.max(0, start + deleteCount)
    const delRange = startIndex < 0 && delCount >= 0 ? '' : delCount
    const rangeSelector = `${selector}[${startIndex}:${delRange}]`
    return this.insert('replace', rangeSelector, items || [])
  },

  ifRevisionId(rev) {
    this.operations.ifRevisionID = rev
    return this
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
        'No `client` passed to patch, either provide one or pass the ' +
          'patch to a clients `mutate()` method'
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
      [op]: assign({}, (merge && this.operations[op]) || {}, props),
    })
    return this
  },
})

module.exports = Patch
