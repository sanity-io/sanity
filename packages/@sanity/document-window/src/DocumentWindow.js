const EventEmitter = require('events')
const dotProp = require('dot-prop')
const debug = require('debug')('document-window')
const Constants = require('./Constants')
const Query = require('./Query')
const sortBy = require('./sortBy')
const concatWindows = require('./concatWindows')
const sortOrderToOperator = require('./sortOrderToOperator')

const listenerEvents = ['mutation', 'welcome']
const listenOptions = {events: listenerEvents}

class DocumentWindow extends EventEmitter {
  constructor(config) {
    super()

    if (!config || !config.client || !config.client.listen) {
      throw new Error('`client` must be an instance of @sanity/client')
    }

    // @todo needs to be duck-typed
    if (!(config.query instanceof Query)) {
      throw new Error('`config.query` must be an instance of Query')
    }

    // Always include a sorting tie-breaker
    this._client = config.client
    this._query = config.query.clone().orderBy(config.query.orderBy().concat([['_id', 'asc']]))

    this._backfill = this._backfill.bind(this)
    this._backfillDebounceMs =
      typeof config.backfillDebounceMs === 'undefined'
        ? Constants.DEFAULT_DEBOUNCE_MS
        : Number(config.backfillDebounceMs)

    this._connected = false
    this._connecting = false
    this._numPending = 0
    this._numConnects = 0
    this._bufferFactor = config.bufferFactor || Constants.DEFAULT_BUFFER_FACTOR
    this._to = config.to || config.query.to() || Constants.DEFAULT_LIMIT
    this._from = config.from || config.query.from() || 0
    this._size = this._to - this._from
    this._bufferSize = this._size * this._bufferFactor
    this._optimalBufferSize = this._bufferSize * 2 + this._size
    this._dataStartIndex = 0

    this.on('newListener', this._scheduleConnect)
    this.on('removeListener', this._onRemoveListener)
  }

  _incPending() {
    this._numPending++
    debug('%d operations pending', this._numPending)
  }

  _decPending() {
    if (--this._numPending === 0) {
      debug('Settled, 0 operations pending')
      this.emit('settle')
    }
  }

  _scheduleConnect(event) {
    if (event !== 'data' && event !== 'debug') {
      return
    }

    this._incPending()

    // @todo Find polyfill for setImmediate for browsers
    setImmediate(() => this._connect())
  }

  _connect() {
    if (this._connecting || this._connected) {
      debug('Already connected/connecting, falling back')
      this._decPending()
      return
    }

    this._connecting = true

    debug('Setting up listener')
    this._listener = this._client
      .listen(this._query.toString({constraintsOnly: true}), this._query.params(), listenOptions)
      .subscribe((evt) => this._onListenerEvent(evt))
  }

  _onListenerEvent(evt) {
    if (evt.type === 'welcome') {
      this._onConnected()
    } else {
      this._onMutation(evt)
    }
  }

  _onRemoveListener() {
    if (this.listenerCount('data') === 0 && this.listenerCount('debug') === 0) {
      this._disconnect()
    }
  }

  _disconnect() {
    if (this._listener) {
      this._listener.unsubscribe()
      this._listener = null
    }

    if (this._request) {
      this._request.unsubscribe()
      this._request = null
    }

    this._numConnects = 0
  }

  _onConnected() {
    const reconnect = this._numConnects > 0
    debug('Listener %sconnected', reconnect ? 're' : '')

    this._connected = true
    this._connecting = false
    this._numConnects++

    this.fetchSnapshotByRange()
    this.emit('connect', {reconnect})
  }

  _onMutation(mut) {
    this.emit('mutation', mut)

    // @todo Store this until our snapshot is fetched?
    if (!this._hasSnapshot) {
      debug('Received mutation, but snapshot not received, skipping')
      return
    }

    debug('Received mutation, processing')
    this._incPending()

    const existingIndex = this._data.findIndex((doc) => doc._id === mut.documentId)
    const hasExisting = existingIndex !== -1
    const wasDeleted = !mut.result

    if (hasExisting && mut.transition === 'disappear') {
      // Existing item disappeared from set (out of contraint or similar)
      debug('Document transitioned out of scope, removing from window')
      this._data = this._data.slice()
      this._data.splice(existingIndex, 1)
      // @todo decrement total assumed list length
    } else if (hasExisting && wasDeleted) {
      // Existing item, deleted
      debug('Document in local range, deleted from server')
      this._data = this._data.slice()
      this._data.splice(existingIndex, 1)
      // @todo decrement total assumed list length
    } else if (hasExisting) {
      // Existing item, updated
      debug('Document in local range, changed on server')
      let newData = this._data.slice()
      newData[existingIndex] = mut.result
      newData = sortBy(newData, this._query.orderBy())
      this._data = newData
      // @todo Surely this isn't enough? We need to check if the new
      // item is within our range (first/last). If it is, fair game,
      // keep sorted list. If not, we need to remove it and trigger
      // a backfill.
    } else {
      // New item
      // @todo increment total assumed list length
      debug('Document is new, calculating position')
      this.placeNewItemInList(mut.result)
    }

    this.scheduleBackFill()
    this.emitCurrentWindow()
  }

  placeNewItemInList(item) {
    const numItems = this._data.length
    const items = [item]

    if (numItems > 0) {
      items.push(this._data[0])
    }

    if (numItems > 1) {
      items.push(this._data[this._data.length - 1])
    }

    const [first, , last] = sortBy(items, this._query.orderBy())
    if (first === item) {
      // If we're at the start of the list, we can simply add the item
      if (this._dataStartIndex === 0) {
        debug('At start of list, prepending')
        const bufferFull = this._data.length === this._optimalBufferSize
        this._data = [item].concat(bufferFull ? this._data.slice(0, -1) : this._data)
        return true
      }

      // Does not fit within list, but it means that the total list length
      // has changed and thus also our start index
      debug('Document is before our pre-window, increasing start index, skipping item')
      this._dataStartIndex++
      return false
    }

    if (last === item) {
      // Does not fit within list
      debug('Document is after the post-window, skipping item')
      return false
    }

    // Fits within our list. Which means that the last item of the list must
    // go, unless we have not filled up our post-buffer, in which case it
    // gets to stay.
    const preSize = this._from - this._dataStartIndex
    const postSize = this._data.length - (preSize + this._size)
    const postFull = postSize === this._bufferSize
    const spliceIndex = postFull ? this._data.length - 1 : 0
    const toRemove = postFull ? 1 : 0

    debug(
      postFull
        ? 'Document fits within window and post-window is full, replacing last item'
        : 'Document fits within window and post-window is NOT full, injecting to start'
    )

    const newData = this._data.slice()
    newData.splice(spliceIndex, toRemove, item)
    this._data = sortBy(newData, this._query.orderBy())

    return true
  }

  fetchSnapshotByRange() {
    if (this._request) {
      this._request.unsubscribe()
    }

    const bufferSize = this._bufferSize
    const fromIndex = Math.max(0, this._from - bufferSize)
    const toIndex = this._to + bufferSize
    const query = this._query.from(fromIndex).to(toIndex)
    debug('Requesting snapshot from %d to %d', fromIndex, toIndex)

    // @todo how do we handle errors?
    this._request = this._client.observable.fetch(query, query.params()).subscribe((data) => {
      debug('Snapshot received, %d items', data.length)

      const sorted = sortBy(data, query.orderBy())
      this._dataStartIndex = fromIndex
      this._data = sorted
      this._request = undefined
      this._hasSnapshot = true

      this.emit('snapshot', data)
      this.emitCurrentWindow()
      this._decPending()
    })
  }

  fetchItemsByConstraint(options) {
    if (this._request) {
      this._request.unsubscribe()
    }

    const {compareWith, end, numItems} = options
    const query = this._query.clone()
    const invert = end === Constants.FRONT

    const orderings = query.orderBy()
    const idOrderIndex = orderings.length - 1
    const constraints = orderings
      .map(([field, order], i) => ({
        field,
        operator: sortOrderToOperator(order, {
          invert,
          // Tiebreaker should never be equal
          orEqual: i !== idOrderIndex,
        }),
        value: JSON.stringify(dotProp.get(compareWith, field)),
      }))
      .map(({field, operator, value}) => `${field} ${operator} ${value}`)

    if (invert) {
      query.orderBy(
        orderings.map(([field, dir]) => [
          field,
          dir === Constants.ASCENDING ? Constants.DESCENDING : Constants.ASCENDING,
        ])
      )
    }

    query.constraint(constraints).from(0).to(numItems)

    // @todo how do we handle errors?
    this._request = this._client.observable.fetch(query, query.params()).subscribe((data) => {
      debug('Items by constraint received, %d items', data.length)

      // We have to depend on the fact that our client-side and server-side
      // orders items in the same order and that our listener keeps us up to
      // date on changes.
      const items = concatWindows(this._data, data)
      const sorted = sortBy(items, orderings, end)

      // If we add new items to the "pre"-section of the array, our start
      // index has actually changed, so we need to update it to reflect it.
      if (end === Constants.FRONT) {
        const diff = sorted.length - this._data.length
        this._dataStartIndex -= diff
      }

      // If we have two many items in buffer, we want to purge some of them
      // to keep our memory profile low. Since we're fetching items at the
      // start OR end of the current window, it should never happen that we
      // need to slice both at front and at the back
      let newData = sorted
      if (sorted.length > this._optimalBufferSize) {
        const preSize = this._from - this._dataStartIndex
        const postSize = sorted.length - (preSize + this._size)
        if (preSize > this._bufferSize) {
          const diff = preSize - this._bufferSize
          newData = newData.slice(diff)
          this._dataStartIndex += diff
          debug('Cutting pre down to appropriate size, diff is %d', diff)
        } else if (postSize > this._bufferSize) {
          const {post} = this.getIndices()
          debug('Cutting post down to appropriate size')
          newData = newData.slice(0, post.from + this._bufferSize)
        }
      }

      this._request = undefined
      this._data = newData
      this.emitCurrentWindow()
      this._decPending()
    })
  }

  to(toIndex) {
    if (typeof toIndex === 'undefined') {
      return this._to
    }

    const size = toIndex - this._from
    if (typeof toIndex !== 'number' || size > 1000) {
      throw new Error('`to` must be a number, query size cannot exceed 1000 items')
    }

    this._to = toIndex
    this.adjustWindow()
    return this
  }

  from(fromIndex) {
    if (typeof fromIndex === 'undefined') {
      return this._from
    }

    if (typeof fromIndex !== 'number' || fromIndex < 0) {
      throw new Error('`from` must be a positive number')
    }

    this._from = fromIndex
    this.adjustWindow()
    return this
  }

  _needsFill() {
    const wantedFromIndex = Math.max(0, this._from - this._bufferSize)
    const wantedEndIndex = this._to + this._bufferSize
    const currentEndIndex = this._dataStartIndex + this._data.length

    debug('Current end index: %d', currentEndIndex)
    debug('Wanted end index : %d', wantedEndIndex)

    const needsFrontFill = wantedFromIndex < this._dataStartIndex
    const needsBackFill = wantedEndIndex > currentEndIndex

    return {
      wantedFromIndex,
      wantedEndIndex,
      currentEndIndex,

      needsBackFill,
      needsFrontFill,
      needsFill: needsBackFill || needsFrontFill,
    }
  }

  adjustWindow() {
    const {needsFill} = this._needsFill()
    if (needsFill) {
      this.scheduleBackFill()
    } else {
      debug('Window adjustment: No backfill needed')
      this.emitCurrentWindow()
    }
  }

  scheduleBackFill() {
    if (this.backfillTimer) {
      clearTimeout(this.backfillTimer)
    }

    this.backfillTimer = setTimeout(this._backfill, this._backfillDebounceMs)
  }

  _backfill() {
    this.backfillTimer = undefined
    const fill = this._needsFill()
    if (!fill.needsFill) {
      debug('Scheduled backfill: No backfill needed')
      this._decPending()
      return
    }

    const frontBufferSize = this._from - this._dataStartIndex
    const rearBufferSize = Math.max(0, this._data.length - (frontBufferSize + this._size))

    let compareWith
    let end = Constants.FRONT
    let numItems
    if (fill.needsFrontFill) {
      numItems = this._bufferSize - frontBufferSize
      compareWith = this._data[0]
    } else {
      compareWith = this._data[this._data.length - 1]
      end = Constants.REAR
      numItems = this._bufferSize - rearBufferSize
    }

    debug('Backfill needed at %s, %d items missing', end, numItems)

    this.emit('backfill', {numItems, end})
    this.fetchItemsByConstraint({
      compareWith,
      end,
      numItems,
    })
  }

  getIndices() {
    const windowFrom = this._from - this._dataStartIndex
    const windowTo = windowFrom + this._size
    return {
      pre: {from: 0, to: windowFrom},
      window: {from: windowFrom, to: windowTo},
      post: {from: windowTo, to: this._data.length},
    }
  }

  onSettle() {
    if (this._numPending === 0) {
      return Promise.resolve()
    }

    return new Promise((resolve) => this.once('settle', resolve))
  }

  debug() {
    const indices = this.getIndices()

    return {
      pre: this._data.slice(indices.pre.from, indices.pre.to),
      window: this._data.slice(indices.window.from, indices.window.to),
      post: this._data.slice(indices.post.from, indices.post.to),
    }
  }

  emitCurrentWindow() {
    const indices = this.getIndices()
    const dataWindow = this._data.slice(indices.window.from, indices.window.to)

    this.emit('data', dataWindow)
    this.emit('debug', {
      pre: this._data.slice(indices.pre.from, indices.pre.to),
      window: dataWindow,
      post: this._data.slice(indices.post.from, indices.post.to),
    })
  }
}

DocumentWindow.Query = Query
module.exports = DocumentWindow
