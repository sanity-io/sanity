import {uuid} from '@sanity/uuid'

/**
 * Locally unique id's. We use this to generate transaction ids, and they don't have to be
 * cryptographically unique, as the worst that can happen is that they get rejected because
 * of a collision, and then we should just retry with a new id.
 */
export const luid = uuid
