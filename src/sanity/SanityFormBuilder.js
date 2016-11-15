import schema from 'part:@sanity/base/schema'
import inputResolver from 'part:@sanity/form-builder/input-resolver'
import previewResolver from 'part:@sanity/base/preview-resolver'
import ValidationList from 'part:@sanity/form-builder/validation-list'

import {
  createFormBuilder,
  Schema
} from '../index'

const compiledSchema = Schema.compile(schema)

export default createFormBuilder({
  schema: compiledSchema,
  resolveInputComponent: inputResolver,
  resolvePreviewComponent: previewResolver,
  resolveValidationComponent: () => ValidationList
})
