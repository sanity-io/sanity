import Reflector from '@sanity/reflector-client'
import PresenceStore from '@sanity/presence-store'
import client from 'part:@sanity/base/client'

export default (() => {
  const presenceStore = new PresenceStore(new Reflector(client).connect(client.config().dataset))

  // Do this to allow the presence store to notify the others that we left. Uses
  // navigator.sendBeacon to get the message out even though the window is closing.
  window.addEventListener('beforeunload', () => presenceStore.close(), false)

  return presenceStore
})()
