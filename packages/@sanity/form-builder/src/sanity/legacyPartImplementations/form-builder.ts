// This exports the public api of '@sanity/form-builder'

import * as patches from '../../patch/patches'

export {default as SanityFormBuilder} from '../SanityFormBuilder'
export {default as FormBuilder} from '../SanityFormBuilder'
export {default as FormBuilderProvider} from '../SanityFormBuilderProvider'
export {default as withDocument} from '../../utils/withDocument'
export {default as withValuePath} from '../../utils/withValuePath'
export {FormBuilderInput} from '../../FormBuilderInput'
export {checkoutPair} from '../formBuilderValueStore'
export {default as HashFocusManager} from '../focusManagers/HashFocusManager'
export {default as SimpleFocusManager} from '../focusManagers/SimpleFocusManager'
export {patches}
export {PortableTextInput as BlockEditor} from '../../inputs/PortableText/PortableTextInput'
