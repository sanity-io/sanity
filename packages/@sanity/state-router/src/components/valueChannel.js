import pubsub from 'nano-pubsub'

export function valueChannel(initial) {
  const channel = pubsub()
  let value = initial
  return {
    publish(nextValue) {
      value = nextValue
      channel.publish(nextValue)
    },
    subscribe(subscriber) {
      subscriber(value)
      return channel.subscribe(subscriber)
    }
  }
}

export function map(channel, mapFn) {
  const chan = valueChannel(null)
  channel.subscribe(value => chan.publish(mapFn(value)))
  return chan
}
