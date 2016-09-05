const assign = require('xtend/mutable')
const Patch = require('./patch')
const validators = require('../validators')

function Transaction(dataClient, operations = []) {
  this.dataClient = dataClient
  this.operations = operations
}

assign(Transaction.prototype, {
  clone(addMutations = []) {
    return new Transaction(
      this.dataClient,
      this.operations.concat(addMutations)
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

    // transaction.patch(client.data.patch('documentId').inc({visits: 1}))
    if (isPatch) {
      return this._add({patch: documentId.serialize()})
    }

    // patch => patch.inc({visits: 1}).set({foo: 'bar'})
    if (isBuilder) {
      const patch = patchOps(new Patch(this.dataClient.client, documentId))
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

  commit() {
    return this.dataClient.mutate(this.serialize())
  },

  reset() {
    this.operations = []
    return this
  },

  _create(doc, op) {
    validators.validateObject(op, doc)
    const dataset = validators.hasDataset(this.dataClient.client.clientConfig)
    const mutation = {[op]: assign({}, doc, {$id: doc.$id || `${dataset}:`})}
    return this._add(mutation)
  },

  _add(mut) {
    return this.clone(mut)
  },

  then: throwPromiseError('then'),
  catch: throwPromiseError('catch')
})

function throwPromiseError(op) {
  return () => {
    throw new Error(`${op}() called on an uncommited transaction, did you forget to call commit()?`)
  }
}

module.exports = Transaction
