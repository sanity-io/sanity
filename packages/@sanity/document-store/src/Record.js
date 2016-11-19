const Observable = require('zen-observable')
const pubsubber = require('nano-pubsub')

class Record {
  constructor(id) {
    this._id = id
    this._pubsub = pubsubber()
  }

  get id() {
    return this._id
  }

  get events() {
    return new Observable(observer => {
      return this._pubsub.subscribe(ev => observer.next(ev))
    })
  }

  publish(ev) {
    this._pubsub.publish(ev)
  }
}

Record.create = function create() {
  return new Record()
}

module.exports = Record
