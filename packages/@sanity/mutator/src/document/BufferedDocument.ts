// A wrapper for Document that allows the client to gather mutations on the client side and commit them
// when it wants to.

import {isEqual} from 'lodash'

import Document from './Document'
import Mutation from './Mutation'
import SquashingBuffer from './SquashingBuffer'
import debug from './debug'
import {Doc} from './types'

const ONE_MINUTE = 1000 * 60

class Commit {
  mutations: Mutation[]
  tries: number
  resolve: () => {}
  reject: (error: Error) => {}
  constructor(mutations, {resolve, reject}) {
    this.mutations = mutations
    this.tries = 0
    this.resolve = resolve
    this.reject = reject
  }
  apply(doc: Doc): Doc {
    return Mutation.applyAll(doc, this.mutations)
  }
  squash(doc: Doc) {
    const result = Mutation.squash(doc, this.mutations)
    result.assignRandomTransactionId()
    return result
  }
}

const mutReducerFn = (acc, mut) => {
  acc = acc.concat(mut.mutations)
  return acc
}

export default class BufferedDocument {
  mutations: Mutation[]
  // The Document we are wrapping
  document: Document
  // The Document with local changes applied
  LOCAL: Doc
  // Commits that are waiting to be delivered to the server
  commits: Array<Commit>
  // Local mutations that are not scheduled to be committed yet
  buffer: SquashingBuffer
  onMutation: Function
  onRemoteMutation?: Document['onRemoteMutation']
  onRebase: Function
  onDelete: Function
  commitHandler: Function
  committerRunning: boolean
  onConsistencyChanged: (boolean) => void

  constructor(doc) {
    this.buffer = new SquashingBuffer(doc)
    this.document = new Document(doc)
    this.document.onMutation = (msg) => this.handleDocMutation(msg)
    this.document.onRemoteMutation = (mut) => this.onRemoteMutation && this.onRemoteMutation(mut)
    this.document.onRebase = (msg, remoteMutations, localMutations) =>
      this.handleDocRebase(msg, remoteMutations, localMutations)
    this.document.onConsistencyChanged = (msg) => this.handleDocConsistencyChanged(msg)
    this.LOCAL = doc
    this.mutations = []
    this.commits = []
  }

  // Used to reset the state of the local document model. If the model has been inconsistent
  // for too long, it has probably missed a notification, and should reload the document from the server
  reset(doc) {
    if (doc) {
      debug('Document state reset to revision %s', doc._rev)
    } else {
      debug('Document state reset to being deleted')
    }
    this.document.reset(doc)
    this.rebase([], [])
    this.handleDocConsistencyChanged(this.document.isConsistent())
  }

  // Add a change to the buffer
  add(mutation: Mutation) {
    if (this.onConsistencyChanged) {
      this.onConsistencyChanged(false)
    }
    debug('Staged local mutation')
    this.buffer.add(mutation)
    const oldLocal = this.LOCAL
    this.LOCAL = mutation.apply(this.LOCAL)
    if (this.onMutation && oldLocal !== this.LOCAL) {
      debug('onMutation fired')
      this.onMutation({
        mutation,
        document: this.LOCAL,
        remote: false,
      })
      if (this.LOCAL === null && this.onDelete) {
        this.onDelete(this.LOCAL)
      }
    }
  }

  // Call when a mutation arrives from Sanity
  arrive(mutation: Mutation) {
    debug('Remote mutation arrived %s -> %s', mutation.previousRev, mutation.resultRev)
    if (mutation.previousRev == mutation.resultRev) {
      throw new Error(
        `Mutation ${mutation.transactionId} has previousRev == resultRev (${mutation.previousRev})`
      )
    }
    return this.document.arrive(mutation)
  }

  // Submit all mutations in the buffer to be committed
  commit() {
    return new Promise<void>((resolve, reject) => {
      // Anything to commit?
      if (!this.buffer.hasChanges()) {
        resolve()
        return
      }
      debug('Committing local changes')
      // Collect current staged mutations into a commit and ...
      this.commits.push(new Commit([this.buffer.purge()], {resolve, reject}))
      // ... clear the table for the next commit.
      this.buffer = new SquashingBuffer(this.LOCAL)
      this.performCommits()
    })
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
        debug('Commit succeeded')
        docResponder.success()
        commit.resolve()
        // Keep running the committer until no more commits
        this._cycleCommitter()
      },
      failure: () => {
        debug('Commit failed')
        // Re stage commit
        commit.tries += 1
        if (this.LOCAL !== null) {
          // Only schedule this commit for a retry of the document still exist to avoid looping
          // indefinitely when the document was deleted from under our noses
          this.commits.unshift(commit)
        }
        docResponder.failure()
        // Todo: Need better error handling (i.e. propagate to user and provide means of retrying)
        if (commit.tries < 200) {
          setTimeout(() => this._cycleCommitter(), Math.min(commit.tries * 1000, ONE_MINUTE))
        }
      },
      cancel: (error) => {
        this.commits.forEach((commit) => commit.reject(error))
        // Throw away waiting commits
        this.commits = []
        // Reset back to last known state from gradient and
        // cause a rebase that will reset the view in the
        // form
        this.reset(this.document.HEAD)
        // Clear the buffer of recent mutations
        this.buffer = new SquashingBuffer(this.LOCAL)

        // Stop the committer loop
        this.committerRunning = false
      },
    }
    debug('Posting commit')
    this.commitHandler({
      mutation: squashed,
      success: responder.success,
      failure: responder.failure,
      cancel: responder.cancel,
    })
  }

  handleDocRebase(msg, remoteMutations, localMutations) {
    this.rebase(remoteMutations, localMutations)
  }

  handleDocumentDeleted() {
    debug('Document deleted')
    // If the document was just deleted, fire the onDelete event with the absolutely latest version of the document
    // before someone deleted it so that the client may revive the document in the last state the user saw it, should
    // she so desire.
    if (this.LOCAL !== null && this.onDelete) {
      this.onDelete(this.LOCAL)
    }
    this.commits = []
    this.mutations = []
  }

  handleDocMutation(msg) {
    // If we have no local changes, we can just pass this on to the client
    if (this.commits.length == 0 && !this.buffer.hasChanges()) {
      debug('Document mutated from remote with no local changes')
      this.LOCAL = this.document.EDGE
      this.buffer = new SquashingBuffer(this.LOCAL)
      if (this.onMutation) {
        this.onMutation(msg)
      }
      return
    }
    debug('Document mutated from remote with local changes')

    // If there are local edits, and the document was deleted, we need to purge those local edits now
    if (this.document.EDGE === null) {
      this.handleDocumentDeleted()
    }

    // We had local changes, so need to signal rebase
    this.rebase([msg.mutation], [])
  }

  rebase(remoteMutations: Mutation[], localMutations: Mutation[]) {
    debug('Rebasing document')
    if (this.document.EDGE === null) {
      this.handleDocumentDeleted()
    }

    const oldLocal = this.LOCAL
    this.LOCAL = this.commits.reduce((doc, commit) => commit.apply(doc), this.document.EDGE)
    this.LOCAL = this.buffer.rebase(this.LOCAL)
    // Copy over rev, since we don't care if it changed, we only care about the content
    if (oldLocal !== null && this.LOCAL !== null) {
      oldLocal._rev = this.LOCAL._rev
    }
    const changed = !isEqual(this.LOCAL, oldLocal)
    if (changed && this.onRebase) {
      this.onRebase(
        this.LOCAL,
        remoteMutations.reduce(mutReducerFn, []),
        localMutations.reduce(mutReducerFn, [])
      )
    }
  }

  handleDocConsistencyChanged(isConsistent: boolean) {
    if (!this.onConsistencyChanged) {
      return
    }
    const hasLocalChanges = this.commits.length > 0 || this.buffer.hasChanges()

    if (isConsistent && !hasLocalChanges) {
      this.onConsistencyChanged(true)
    }
    if (!isConsistent) {
      this.onConsistencyChanged(false)
    }
  }
}
