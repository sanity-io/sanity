import Arr from './inputs/Array'
import Bool from './inputs/Boolean'
import Email from './inputs/Email'
import Num from './inputs/Number'
import Obj from './inputs/Object'
import Reference from './inputs/Reference'
import Str from './inputs/String'
import Text from './inputs/Text'
import Url from './inputs/Url'

import ArrayField from './fields/Array'
import BooleanField from './fields/Boolean'
import ObjectField from './fields/Object'

export const inputComponents = {
  object: Obj,
  array: Arr,
  boolean: Bool,
  number: Num,
  text: Text,
  email: Email,
  reference: Reference,
  url: Url,
  string: Str
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
