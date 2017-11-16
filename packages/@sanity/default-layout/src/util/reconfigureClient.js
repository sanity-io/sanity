import client from 'part:@sanity/base/client'
import getConfiguredSpaces from './getConfiguredSpaces'

export default function reconfigureClient(routerState) {
  const space = getConfiguredSpaces().find(sp => sp.name === routerState.space)
  if (space && space.api) {
    client.config(space.api)
  }
}
