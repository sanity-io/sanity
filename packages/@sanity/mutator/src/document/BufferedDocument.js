// A wrapper for Document that allows the client to gather mutations on the client side and commit them
// when it wants to.

import {isEqual} from 'lodash'

import Document from './Document'
import Mutation from './Mutation'

class Commit {
  mutations : mutations
  tries : number
  constructor(mutations) {
    this.mutations = mutations
    this.tries = 0
  }
  apply(doc : Object) : Object {
    return Mutation.applyAll(doc, this.mutations)
  }
  squash(doc : Object) {
    const result = Mutation.squash(doc, this.mutations)
    result.assignRandomTransactionId()
    return result
  }
}

export default class BufferedDocument {
  // The Document we are wrapping
  document : Document
  // The Document with local changes applied
  LOCAL : Object
  // Commits that are waiting to be delivered to the server
  commits : Array<Commit>
  // Local mutations that are not scheduled to be committed yet
  mutations : Array<Mutation>
  onMutation : Function
  onRebase : Function
  commitHandler : Function
  constructor(doc) {
    this.document = new Document(doc)
    this.document.onMutation = msg => this.handleDocMutation(msg)
    this.document.onRebase = msg => this.handleDocRebase(msg)
    this.LOCAL = doc
    this.mutations = []
    this.commits = []
  }

  // Used to reset the state of the local document model. If the model has been inconsistent
  // for too long, it has probably missed a notification, and should reload the document from the server
  reset(doc) {
    this.document.reset(doc)
    this.rebase()
  }

  // Add a change to the buffer
  add(mutation : Mutation) {
    this.mutations.push(mutation)
    const oldLocal = this.LOCAL
    this.LOCAL = mutation.apply(this.LOCAL)
    if (this.onMutation) {
      this.onMutation({
        mutation,
        document: this.LOCAL,
        remote: false
      })
    }
  }

  // Call when a mutation arrives from Sanity
  arrive(mutation : Mutation) {
    return this.document.arrive(mutation)
  }

  // Submit all mutations in the buffer to be committed
  commit() {
    // Anything to commit?
    if (this.mutations.length == 0) {
      return
    }
    // Collect current staged mutations into a commit and ...
    this.commits.push(new Commit(this.mutations))
    // ... clear the table for the next commit.
    this.mutations = []
    this.performCommits()
  }

  // Starts the committer that will try to committ all staged commits to the database
  // by calling the commitHandler. Will keep running until all commits are successfully
  // committed.
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

  // TODO: Error handling, right now retries after every error,
  _cycleCommitter() {
    if (this.commits.length == 0) {
      this.committerRunning = false
      return
    }
    this.committerRunning = true
    const commit = this.commits.shift()
    const squashed = commit.squash(this.LOCAL)
    const docResponder = this.document.stage(squashed, true)

    const responder = {
      success: () => {
        docResponder.success()
        // Keep running the committer until no more commits
        this._cycleCommitter()
      },
      failure: () => {
        // Re stage commit
        commit.tries += 1
        this.commits.unshift(commit)
        docResponder.failure()
        // Retry
        // TODO: Be able to _not_ retry if failure is permanent
        setTimeout(() => this._cycleCommitter(), 1000)
      }
    }
    this.commitHandler({
      mutation: squashed,
      success: responder.success,
      failure: responder.failure
    })
  }

  handleDocRebase(msg) {
    this.rebase()
  }

  handleDocMutation(msg) {
    // If we have no local changes, we can just pass this on to the client
    if (this.commits.length == 0 && this.mutations.length == 0) {
      this.LOCAL = this.document.EDGE
      if (this.onMutation) {
        this.onMutation(msg)
      }
    }
    // It wasn't. Need to rebase
    this.rebase()
  }

  rebase() {
    const oldLocal = this.LOCAL
    this.LOCAL = this.commits.reduce((doc, commit) => commit.apply(doc), this.document.EDGE)
    this.LOCAL = Mutation.applyAll(this.LOCAL, this.mutations)
    // Copy over rev, since we don't care if it changed, we only care about the content
    oldLocal._rev = this.LOCAL._rev
    const changed = !isEqual(this.LOCAL, oldLocal)
    if (changed && this.onRebase) {
      this.onRebase(this.LOCAL)
    }
  }
}
