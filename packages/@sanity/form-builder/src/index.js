import * as defaultInputs from './defaultInputComponents'
import * as FileInput from './inputs/File'
import * as ImageInput from './inputs/Image'
import * as ReferenceInput from './inputs/Reference'
import * as SlugInput from './inputs/Slug'
import SlateInput from './inputs/BlockEditor-slate'

export {defaultInputs}

export {default as defaultConfig} from './defaultConfig'
export {default as SlateInput} from './inputs/BlockEditor-slate'
export {default as createFormBuilder} from './createFormBuilder'

// Input component factories
export {ReferenceInput}
export {ImageInput}
export {FileInput}
export {SlugInput}
export {SlateInput}
