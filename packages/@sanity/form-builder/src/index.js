import * as defaultInputs from './defaultInputComponents'
import * as FileInput from './inputs/File'
import * as ImageInput from './inputs/Image'
import * as ReferenceInput from './inputs/Reference'
import * as SlugInput from './inputs/Slug'
import * as defaultConfig from './defaultConfig'

export {defaultInputs}
export {defaultConfig}

export {default as createFormBuilder} from './createFormBuilder'
export {default as SlateInput} from './inputs/BlockEditor-slate'

// Input component factories
export {ReferenceInput}
export {ImageInput}
export {FileInput}
export {SlugInput}
