export default function pubsubber() {
  const subscribers = []
  return {
    subscribe,
    once,
    publish
  }
  function subscribe(subscriber) {
    subscribers.push(subscriber)
    return unsubscribe.bind(null, subscriber)
  }
  function once(subscriber) {
    const unsub = subscribe((...args) => {
      subscriber(...args)
      unsub()
    })
    return unsub
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
