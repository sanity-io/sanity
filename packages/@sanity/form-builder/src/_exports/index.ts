// This exports the public api of '@sanity/form-builder'

export * from '../sanity/legacyPartImplementations/form-builder'

export * from '../PatchEvent'
export {default} from '../PatchEvent'

// Export `FormInputProps` so it can be used to build custom input components with type safety.
export type {FormInputProps} from '../types'

// Export `PortableTextMarker` so it can be used to build custom Portable Text markers.
export type {PortableTextMarker} from '../inputs/PortableText/types'
