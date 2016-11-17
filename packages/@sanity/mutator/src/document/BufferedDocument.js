// A wrapper for Document that allows the client to gather mutations on the client side and commit them
// when it wants to.

import {isEqual} from 'lodash'

import Document from './Document'
import Mutation from './Mutation'

class Commit {
  mutations : mutations
  constructor(mutations) {
    this.mutation = mutation
  }
  apply(doc : Object) : Object {
    return Mutation.applyAll(doc, this.mutations)
  }
  squash(doc : Object) {
    result = Mutation.squash(doc, this.mutations)
    result.assignRandomTransactionId()
    return result
  }
}

export default class BufferedDocument {
  document : Document
  LOCAL : Object
  // The single mutation that is currently trying to be committed. Not part of the rebase chain since this is
  // also represented in the outgoing set until it is committed
  pending : Mutation
  // When we commit mutations, always push the transaction id to this array so we can recognize own mutations
  // and ignore them
  ownMutationTxnIds : Array<string>
  // Groups of mutations that are to be committed. Each set represents one call to commit()
  outgoing : Array<Commit>
  // Local mutations that are not scheduled to be committed yet
  mutations : Array<Mutation>
  onMutation : Function
  onRebase : Function
  commitHandler : Function
  constructor(doc) {
    this.doc = new Document(doc)
    this.doc.onMutation = msg => this.handleDocMutation(msg)
    this.doc.onRebase = msg => this.handleDocRebase(msg)
    this.LOCAL = doc
    this.mutations = []
    this.commits = []
  }

  add(mutation : Mutation) {
    this.mutations.push(mutation)
    this.LOCAL = mutation.apply(this.LOCAL)
    if (this.onMutation) {
      this.onMutation({
        mutation,
        document: this.LOCAL,
        remote: false
      })
    }
  }

  commit() {
    this.outgoing.push(new Commit(this.mutations))
    this.mutations = []
  }

  // Takes care of submitting the commits, will keep running as long as there are commits to be committed
  performCommits() {
    if (!this.commitHandler) {
      throw new Error('No commitHandler configured for this BufferedDocument')
    }
    if (this.committerRunning) {
      // We can have only one committer at any given time
      return
    }
    this._cycleCommitter()
  }

  _cycleCommitter() {
    if (this.commits.length == 0) {
      this.committerRunning = false
      return
    }
    this.committerRunning = true
    const commit = this.commits.shift()
    const squashed = commit.squash(this.LOCAL)
    const docResponder = this.doc.stage(squashed)

    const responder = {
      success: () => {
        docResponder.success()
        // Keep running the committer until no more commits
        this._cycleCommitter()
      },
      failure: () => {
        // Re stage commit
        this.commits.unshift(commit)
        docResponder.failure()
        // Retry
        setTimeout(() => this.cycleCommitter(), 1000)
      }
    }
    this.commitHandler(squashed.mutations, responder)
  }

  handleDocRebase(msg) {
    this.rebase()
  }

  handleDocMutation(msg) {
    // If we have no local changes, we can just pass this on to the client
    if (this.commits.length == 0 && this.mutations.length == 0) {
      this.LOCAL = this.doc.EDGE
      if (this.onMutation) {
        this.onMutation(msg)
      }
    }
    // It wasn't. Need to rebase
    this.rebase()
  }

  rebase() {
    const oldLocal = this.LOCAL
    this.LOCAL = this.commits.reduce((doc, commit) => commit.apply(doc), this.doc.EDGE)
    this.LOCAL = Mutation.applyAll(this.LOCAL, this.mutations)
    // Copy over rev, since we don't care if it changed, we only care about the content
    oldLocal._rev = this.EDGE._rev
    const changed = !isEqual(this.LOCAL, oldLocal)
    if (changed && this.onRebase) {
      this.onRebase(this.LOCAL)
    }
  }
}
