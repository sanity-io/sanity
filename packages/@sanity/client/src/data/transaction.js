const assign = require('object-assign')
const validators = require('../validators')
const Patch = require('./patch')

const defaultMutateOptions = {returnDocuments: false}

function Transaction(operations = [], client) {
  this.operations = operations
  this.client = client
}

assign(Transaction.prototype, {
  clone() {
    return new Transaction(
      this.operations.slice(0),
      this.client
    )
  },

  create(doc) {
    validators.validateObject('create', doc)
    return this._add({create: doc})
  },

  createIfNotExists(doc) {
    const op = 'createIfNotExists'
    validators.validateObject(op, doc)
    validators.requireDocumentId(op, doc)
    return this._add({[op]: doc})
  },

  createOrReplace(doc) {
    const op = 'createOrReplace'
    validators.validateObject(op, doc)
    validators.requireDocumentId(op, doc)
    return this._add({[op]: doc})
  },

  delete(documentId) {
    validators.validateDocumentId('delete', documentId)
    return this._add({delete: {id: documentId}})
  },

  patch(documentId, patchOps) {
    const isBuilder = typeof patchOps === 'function'
    const isPatch = documentId instanceof Patch

    // transaction.patch(client.patch('documentId').inc({visits: 1}))
    if (isPatch) {
      return this._add({patch: documentId.serialize()})
    }

    // patch => patch.inc({visits: 1}).set({foo: 'bar'})
    if (isBuilder) {
      const patch = patchOps(new Patch(documentId, {}, this.client))
      if (!(patch instanceof Patch)) {
        throw new Error('function passed to `patch()` must return the patch')
      }

      return this._add({patch: patch.serialize()})
    }

    return this._add({patch: assign({id: documentId}, patchOps)})
  },

  serialize() {
    return this.operations.slice()
  },

  toJSON() {
    return this.serialize()
  },

  commit(options) {
    if (!this.client) {
      throw new Error(
        'No `client` passed to transaction, either provide one or pass the '
        + 'transaction to a clients `mutate()` method'
      )
    }

    return this.client.mutate(this.serialize(), options || defaultMutateOptions)
  },

  reset() {
    this.operations = []
    return this
  },

  _add(mut) {
    this.operations.push(mut)
    return this
  }
})

module.exports = Transaction
