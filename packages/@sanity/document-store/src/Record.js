const {Subject, Observable} = require('rxjs')
const applyPatch = require('./utils/applyPatch')
const pubsubber = require('./utils/pubsubber')

class Record {
  constructor(snapshot) {
    this._snapshot = snapshot
    this._pubsub = pubsubber()
  }

  get snapshot() {
    return this._snapshot
  }

  get id() {
    return this._snapshot.id
  }

  get events() {
    return new Observable(observer => {
      if (this._snapshot) {
        observer.next({type: 'snapshot', document: this._snapshot})
      }
      return this._pubsub.subscribe(ev => observer.next(ev))
    })
  }

  delete() {
    this._snapshot = null
    this.publish({type: 'delete', document: null})
  }

  update(patch) {
    this.publish({type: 'update', patch: patch})
    this._snapshot = applyPatch(this._snapshot, patch)
    this.publishSnapshot()
  }

  replace(doc) {
    this.publish({type: 'replace', document: doc})
    if (doc.id !== this.snapshot.id) {
      throw new Error(`Id mismatch when replacing document #${this.snapshot.id}. Wrong id: ${doc.id}`)
    }
    this._snapshot = doc
    this.publishSnapshot()
  }

  // receive an sync event from server
  sync(document) {
    this._snapshot = document
    this.publishSnapshot()
  }

  publish(ev) {
    this._pubsub.publish(ev)
  }

  publishSnapshot() {
    this.publish({type: 'snapshot', document: this._snapshot})
  }
}

Record.create = function create(snapshot) {
  return new Record(snapshot)
}

module.exports = Record
