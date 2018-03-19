// Locally unique id's. We use this to generate transaction ids, and they don't have to be cryptographically
// unique, as the worst that can happen is that they get rejected because of a collision, and then we should just
// retry with a new id.

export default function luid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(36)
      .substring(1)
  }
  return `${s4() + s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`
}
