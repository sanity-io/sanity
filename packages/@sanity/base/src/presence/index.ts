import {FormFieldPresenceContext} from './context'

// Note: This is the public API of `@sanity/base/presence`
// Any changes here will affect the public API
import type {FormFieldPresence} from './types'

export type {
  GlobalPresence,
  MinimalGlobalPresence,
  DocumentPresence,
} from '../datastores/presence/types'
export type {FormFieldPresence}

export {FormFieldPresenceContext}
export {PresenceOverlay} from './overlay/PresenceOverlay'
export {FieldPresence} from './FieldPresence'
export {PresenceScope} from './PresenceScope'

export {DocumentPreviewPresence} from './DocumentPreviewPresence'
