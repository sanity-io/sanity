module.exports = (fn) => {
  let didCall = false
  let returnValue
  return (...args) => {
    if (didCall) {
      return returnValue
    }
    returnValue = fn(...args)
    didCall = true
    return returnValue
  }
}
