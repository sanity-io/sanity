// This exports the public api of '@sanity/form-builder'

// patch event
export * from './PatchEvent'

// Export `FormInputProps` so it can be used to build custom input components with type safety.
export type {FormBuilderFilterFieldFn, FormInputProps} from './types'

// sanity
export * from './sanity/contexts'
export {SanityFormBuilder} from './sanity/SanityFormBuilder'
export {SanityFormBuilderProvider} from './sanity/SanityFormBuilderProvider'
export {checkoutPair} from './sanity/formBuilderValueStore'
export {HashFocusManager} from './sanity/focusManagers/HashFocusManager'
export {SimpleFocusManager} from './sanity/focusManagers/SimpleFocusManager'

// utils
export {withDocument} from './utils/withDocument'
export {withValuePath} from './utils/withValuePath'

// root components
export type {FormBuilderInputProps} from './FormBuilderInput'
export {FormBuilderInput, FormBuilderInputInstance} from './FormBuilderInput'

// inputs
// Export `PortableTextMarker` so it can be used to build custom Portable Text markers.
export type {PortableTextMarker} from './inputs/PortableText/types'
export {PortableTextInput as BlockEditor} from './inputs/PortableText/PortableTextInput'
