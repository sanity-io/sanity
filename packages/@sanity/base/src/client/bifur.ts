import client from 'part:@sanity/base/client'
import {fromSanityClient} from '@sanity/bifur-client'

export const bifur = fromSanityClient(client)
