const assign = require('object-assign')
const helpUrl = require('@sanity/generate-help-url')
const {QueueLimitError} = require('./errors')

function RateLimiterWithQueue(options) {
  this.store = []
  this.onRateLimited = options.onRateLimited
  this.queue = []
  this.onRateLimited = null
  this.ttls = null
  this.backoffStatusCodes = 429
  this.requestCount = 0
  this.maxQueueSize = 3
  this.timeoutId = null

  if (typeof options.maxRps !== 'number' || options.maxRps < 0) {
    throw new Error('Missing or invalid maxRps')
  }

  if (typeof options.interval !== 'number' || options.interval < 0) {
    throw new Error('Missing or invalid interval')
  }

  if (options.onRateLimited && typeof options.onRateLimited === 'function') {
    this.onRateLimited = options.onRateLimited
  }

  if (options.maxQueueSize && typeof options.maxQueueSize === 'number') {
    this.maxQueueSize = options.maxQueueSize
  }

  this.maxRps = options.maxRps
  this.interval = options.interval
}

assign(RateLimiterWithQueue.prototype, {
  handleRequest(request) {
    return new Promise(
      function(resolve, reject) {
        try {
          const req = this._addToDelayQueue(request)
          this._shift()
          resolve(req)
        } catch (e) {
          reject(e)
        }
      }.bind(this)
    )
  },

  _addToDelayQueue(request) {
    return new Promise(
      function(resolve, reject) {
        if (this.queue.length >= this.maxQueueSize) {
          const e = new QueueLimitError(
            `You have reached your client side rate limit threshold to learn more, visit ${helpUrl(
              'js-client-rate-limit'
            )}`
          )
          reject(e)
        }
        this._push({
          resolve() {
            resolve(request)
          }
        })
      }.bind(this)
    )
  },

  _push(requestHandler) {
    this.queue.push(requestHandler)
    this._shiftInit()
  },

  _shift() {
    if (!this.queue.length) return
    if (this.requestCount === this.maxRps) {
      if (this.onRateLimited) this.onRateLimited(this.requestCount >= this.maxRps)
      if (this.timeoutId && typeof this.timeoutId.ref === 'function') {
        this.timeoutId.ref()
      }

      return
    }

    const queued = this.queue.shift()
    queued.resolve()

    if (this.requestCount === 0) {
      this.timeoutId = setTimeout(
        function() {
          this.requestCount = 0
          this._shift()
        }.bind(this),
        this.interval
      )

      if (typeof this.timeoutId.unref === 'function') {
        if (this.queue.length === 0) this.timeoutId.unref()
      }
    }

    this.requestCount += 1
  },

  _shiftInit() {
    setTimeout(
      function() {
        return this._shift()
      }.bind(this),
      0
    )
  }
})

module.exports = RateLimiterWithQueue
