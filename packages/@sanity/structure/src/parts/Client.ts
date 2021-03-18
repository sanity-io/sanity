import {ClientConfig, SanityClient} from '@sanity/client'
import getDefaultModule from './getDefaultModule'

type StudioClient = SanityClient & {withConfig: (config: Partial<ClientConfig>) => SanityClient}

// We are lazy-loading the part to work around typescript trying to resolve it
const client = ((): SanityClient => {
  const sanityClient: StudioClient = getDefaultModule(require('part:@sanity/base/client'))
  return sanityClient.withConfig({apiVersion: '1'})
})()

export {client}
