// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import client from 'part:@sanity/base/client'
import {CONFIGURED_SPACES, ApiConfig} from './spaces'

type StudioClient = {
  config(newConfig?: ApiConfig, silenceConfigWarning?: boolean): unknown
}

export default function reconfigureClient(routerState: {space: string}): void {
  const space = CONFIGURED_SPACES.find((sp) => sp.name === routerState.space)
  if (space && space.api) {
    ;(client as StudioClient).config(space.api, true)
  }
}
