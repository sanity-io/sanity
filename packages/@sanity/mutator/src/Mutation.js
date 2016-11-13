// @flow

import Operation from './Operation'

// A mutation describing a number of operations on a single document
export default class Mutation {
  operations : Operation[]
  fromRev : string
  toRev : string
  documentId : string

  constructor(documentId : string) {
    this.operations = []
    this.documentId = documentId
  }

  setOperations(operations : Operation[]) {
    if (operations.find(op => op.documentId != this.documentId)) {
      throw new Error('All operations in a Mutation must be on the same document')
    }
    this.operations = operations
  }

  static fromNotification(notification) {
    const operations = notification.mutations.map(mut => {
      return new Operation(mut)
    })
    if (operations.length == 0) {
      return null
    }
    const documentId = operations[0].documentId
    const result = new Mutation(documentId)
    result.setOperations(operations)
    result.fromRev = notification.fromRev
    result.toRev = notification.toRev
    return result
  }
}
