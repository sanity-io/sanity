export default function isSubscribable(thing) {
  return thing && (typeof thing.then === 'function' || typeof thing.subscribe === 'function')
}
