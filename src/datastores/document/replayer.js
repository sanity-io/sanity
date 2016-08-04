import pubsubber from '../utils/pubsubber'

export default function replayer(array, opts = {}, createEvent) {
  let idx = 0
  let timer
  const channel = pubsubber()

  return {
    start: next,
    stop: stop,
    reset: reset,
    subscribe: channel.subscribe
  }

  function reset() {
    idx = 0
  }

  function stop() {
    clearTimeout(timer)
  }

  function next() {
    const last = idx === array.length - 1 && opts.infinite !== false

    const value = createEvent(array[idx], idx, {
      last: last
    })

    channel.publish(value)

    if (last) {
      return
    }

    idx = idx === array.length ? 0 : idx + 1

    const wait = (typeof opts.wait === 'function') ? opts.wait(idx) : (opts.wait || 1000)

    timer = setTimeout(next, wait)
  }
}
