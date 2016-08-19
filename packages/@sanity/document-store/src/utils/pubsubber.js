module.exports = function pubsubber() {
  const subscribers = []
  return {
    subscribe,
    publish
  }
  function subscribe(subscriber) {
    subscribers.push(subscriber)
    return unsubscribe.bind(null, subscriber)
  }
  function publish(...args) {
    subscribers.forEach(subscriber => subscriber(...args))
  }
  function unsubscribe(fn) {
    const idx = subscribers.indexOf(fn)
    if (idx) {
      subscribers.splice(idx, 1)
    }
  }
}
