import {fromSanityClient} from '@sanity/bifur-client'
import {versionedClient} from './versionedClient'

export const bifur = fromSanityClient(versionedClient)
