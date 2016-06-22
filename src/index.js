import Obj from './inputs/Object'
import Arr from './inputs/Array'
import Bool from './inputs/Boolean'
import Num from './inputs/Number'
import Blocks from './inputs/Blocks'
import Email from './inputs/Email'
import Url from './inputs/Url'
import Text from './inputs/Text'
import Reference from './inputs/Reference'
import Str from './inputs/String'
import RichText from './inputs/RichText'

import BooleanField from './fields/Boolean'
import ObjectField from './fields/Object'
import ArrayField from './fields/Array'

export const inputComponents = {
  object: Obj,
  array: Arr,
  boolean: Bool,
  number: Num,
  text: Text,
  email: Email,
  reference: Reference,
  url: Url,
  string: Str,
  blocks: Blocks,
  richtext: RichText
}

export const fieldComponents = {
  boolean: BooleanField,
  object: ObjectField,
  array: ArrayField
}

export {default as DefaultField} from './fields/Default'
export {default as Fieldset} from './Fieldset'

export {createFormBuilderState} from './state/FormBuilderState'
export {compile as compileSchema} from './utils/compileSchema'

export {default as FormBuilderProvider} from './FormBuilderProvider'
export {FormBuilder} from './FormBuilder'
