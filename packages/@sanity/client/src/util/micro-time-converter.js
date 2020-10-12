exports.microsecondsToMilliseconds = function(microseconds) {
  return Math.ceil(microseconds / 1000)
}

exports.millisecondsToMicroseconds = function(milliseconds) {
  return 1000 * milliseconds
}
