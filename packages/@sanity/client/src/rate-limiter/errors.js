const makeError = require('make-error')

function QueueLimitError(message) {
  QueueLimitError.super.call(this, message)
  this.message = message
}

function RateLimitError(message) {
  RateLimitError.super.call(this, message)
  this.message = message
}

makeError(RateLimitError)
makeError(QueueLimitError)

exports.RateLimitError = RateLimitError
exports.QueueLimitError = QueueLimitError
