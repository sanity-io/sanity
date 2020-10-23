import client from 'part:@sanity/base/client'
import {CONFIGURED_SPACES} from './spaces'

export default function reconfigureClient(routerState) {
  const space = CONFIGURED_SPACES.find((sp) => sp.name === routerState.space)
  if (space && space.api) {
    client.config(space.api)
  }
}
