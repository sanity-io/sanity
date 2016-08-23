const {Subject, Observable} = require('rxjs')
const applyPatch = require('./utils/applyPatch')
const pubsubber = require('./utils/pubsubber')

class Record {
  constructor(snapshot) {
    this._snapshot = snapshot
    this._events = null
  }

  get snapshot() {
    return this._snapshot
  }

  get id() {
    return this._snapshot.id
  }

  get events() {
    if (!this._events) {
      this._events = pubsubber()
    }
    return new Observable(observer => {
      if (this._snapshot) {
        observer.next({type: 'snapshot', document: this._snapshot})
      }
      return this._events.subscribe(ev => observer.next(ev))
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

  // receive an event from server
  sync(document) {
    const hadSnapshot = !!this._snapshot
    this._snapshot = document
    if (!hadSnapshot) {
      this.publishSnapshot()
    }
  }

  publish(ev) {
    this._events.publish(ev)
  }

  publishSnapshot() {
    this.publish({type: 'snapshot', document: this._snapshot})
  }
}

Record.create = function create(snapshot) {
  return new Record(snapshot)
}

module.exports = Record
