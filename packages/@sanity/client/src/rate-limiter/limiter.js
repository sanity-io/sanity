// Based on the sliding window algorithm https://en.wikipedia.org/wiki/Sliding_window_counter

const assign = require('object-assign')
const helpUrl = require('@sanity/generate-help-url')
const microtime = require('microtime-nodejs')
const timeConverter = require('../util/micro-time-converter')
const {RateLimitError, QueueLimitError} = require('./errors')

const getCurrentMicroseconds = microtime.now

function RateLimiter(options) {
  this.store = []
  this.onRateLimited = null
  this.ttls = null
  this.requestCount = 0
  this.maxQueueSize = Infinity

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
  this.interval = timeConverter.millisecondsToMicroseconds(options.interval)
}

assign(RateLimiter.prototype, {
  handleRequestAsync(request) {
    return new Promise(
      function(resolve, reject) {
        const info = this.limitWithInfo()
        if (info.blocked) {
          this.onRateLimited(this.limitWithInfo().blocked)
          const e = new RateLimitError(`
              You have reached your client side rate limit threshold to learn more, visit ${helpUrl(
                'js-client-rate-limit'
              )}
            `)
          reject(e)
        }
        resolve(request)
      }.bind(this)
    )
  },

  handleRequest(request) {
    const info = this.limitWithInfo()
    if (info.blocked) {
      this.onRateLimited(this.limitWithInfo().blocked)
      throw new RateLimitError(`
              You have reached your client side rate limit threshold to learn more, visit ${helpUrl(
                'js-client-rate-limit'
              )}
            `)
    }
    return request && request
  },

  isRequestBlocked() {
    const info = this.limitWithInfo()
    if (info.blocked) {
      this.onRateLimited(this.limitWithInfo().blocked)
    }
    return info.blocked
  },

  limitWithInfo() {
    const timestamps = this._getTimestamps(true)
    return this._calculateInfo(timestamps)
  },

  _calculateInfo(timestamps) {
    const timestampsLen = timestamps.length
    const currentTimestamp = timestamps[timestampsLen - 1]

    const blocked = timestampsLen > this.maxRps

    const microsecondsUntilAllowed = Math.max(
      0,
      timestampsLen >= this.maxRps
        ? timestamps[Math.max(0, timestampsLen - this.maxRps)] - currentTimestamp + this.interval
        : 0
    )

    return {
      blocked,
      coolTime: timeConverter.microsecondsToMilliseconds(microsecondsUntilAllowed),
      requestRemaining: Math.max(0, this.maxRps - timestampsLen)
    }
  },

  _getTimestamps(addNewTimestamp) {
    const currentTimestamp = getCurrentMicroseconds()

    const clearBefore = currentTimestamp - this.interval
    const storedTimestamps = (this.store || []).filter(t => t > clearBefore)

    if (addNewTimestamp) {
      storedTimestamps.push(currentTimestamp)

      const ttl = this.ttls
      if (ttl) clearTimeout(ttl)
      this.ttls = setTimeout(() => {
        this.store = []
        this.ttls = null
      }, timeConverter.microsecondsToMilliseconds(this.interval))
    }

    this.store = storedTimestamps
    return storedTimestamps
  }
})

module.exports = RateLimiter
