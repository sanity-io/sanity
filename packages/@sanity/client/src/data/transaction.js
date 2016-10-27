const assign = require('xtend/mutable')
const validators = require('../validators')
const Patch = require('./patch')

const defaultMutateOptions = {returnDocuments: false}

function Transaction(operations = [], client) {
  this.operations = operations
  this.client = client
}

assign(Transaction.prototype, {
  clone(addMutations = []) {
    return new Transaction(
      this.operations.concat(addMutations),
      this.client
    )
  },

  create(doc) {
    return this._create(doc, 'create')
  },

  createIfNotExists(doc) {
    return this._create(doc, 'createIfNotExists')
  },

  createOrReplace(doc) {
    return this._create(doc, 'createOrReplace')
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

  _create(doc, op) {
    if (!doc._id && !this.client) {
      throw new Error(
        'Document needs an _id property when transaction is create outside a client scope. '
        + 'Pass `{_id: "<datasetName>:"}` to have Sanity generate an ID for you.'
      )
    }

    validators.validateObject(op, doc)
    const dataset = validators.hasDataset(this.client.clientConfig)
    const mutation = {[op]: assign({}, doc, {_id: doc._id || `${dataset}/`})}
    return this._add(mutation)
  },

  _add(mut) {
    return this.clone(mut)
  }
})

module.exports = Transaction
