// Takes a predicate and returns a function, when called, will call a given function if predicate() == true
// Useful for turning .then-callbacks into noops if a condition no longer holds true
export default function continueWhen(predicate) {
  return continueFn => {
    return value => { // eslint-disable-line consistent-return
      if (predicate()) {
        return continueFn(value)
      }
    }
  }
}
