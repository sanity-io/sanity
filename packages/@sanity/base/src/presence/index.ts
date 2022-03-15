// Note: This is the public API of `@sanity/base/presence`
// Any changes here will affect the public API

export type {DocumentPresence, GlobalPresence} from '../datastores/presence/types'
export type {FormFieldPresence} from './types'

export {FormFieldPresenceContext} from './context'
export {PresenceOverlay} from './overlay/PresenceOverlay'
export {FieldPresence} from './FieldPresence'
export {PresenceScope} from './PresenceScope'

export {DocumentPreviewPresence} from './DocumentPreviewPresence'
