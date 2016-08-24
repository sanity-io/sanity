import schema from 'schema:@sanity/base/schema'
import inputResolver from 'function:@sanity/form-builder/input-resolver'
import ValidationList from 'component:@sanity/form-builder/validation-list'
import {
  createFormBuilder,
  Schema
} from 'role:@sanity/form-builder'

const compiledSchema = Schema.compile(schema)

export default createFormBuilder({
  schema: compiledSchema,
  resolveInputComponent: inputResolver,
  resolveValidationComponent: () => ValidationList
})
