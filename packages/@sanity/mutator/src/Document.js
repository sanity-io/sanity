// @flow
// import Immutable from 'immutable'

import Mutation from './Mutation'
import Revision from './Revision'

export default class Document {
  incoming : Mutation[]
  submitted : Mutation[]
  HEAD : Object
  EDGE : Object
  constructor(attributes : Object) {
    this.incoming = []
    this.submitted = []

    this.HEAD = new Revision(attributes)
    this.EDGE = new Revision(attributes)
  }

  // Called when a mutation arrives from Sanity
  arrive(mutation : Mutation) {
    this.incoming.push(mutation)
  }

  // Called when a patch is submitted to Sanity
  submit(mutation : Mutation) {
    this.submitted.push(mutation)
  }

}

