import Obj from './inputs/Object'
import Arr from './inputs/Array'
import Bool from './inputs/Boolean'
import Num from './inputs/Number'
import Blocks from './inputs/Blocks'
import Email from './inputs/Email'
import Url from './inputs/Url'
import RichText from './inputs/RichText'
import Reference from './inputs/Reference'
import Str from './inputs/String'

import BooleanField from './fields/Boolean'
import ObjectField from './fields/Object'

export const inputComponents = {
  object: Obj,
  array: Arr,
  boolean: Bool,
  number: Num,
  text: RichText,
  email: Email,
  reference: Reference,
  url: Url,
  string: Str,
  blocks: Blocks
}

export const fieldComponents = {
  boolean: BooleanField,
  object: ObjectField
}

export {default as DefaultField} from './fields/Default'

export {createFormBuilderState} from './state/FormBuilderState'
export {compile as compileSchema} from './utils/compileSchema'

export {default as FormBuilderProvider} from './FormBuilderProvider'
export {FormBuilder} from './FormBuilder'
