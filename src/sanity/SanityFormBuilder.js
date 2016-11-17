import schema from 'part:@sanity/base/schema'
import inputResolver from 'part:@sanity/form-builder/input-resolver'
import previewResolver from 'part:@sanity/base/preview-resolver'
import ValidationList from 'part:@sanity/form-builder/validation-list'
import * as _previewUtils from './preview/utils'

import {
  createFormBuilder,
  Schema
} from '../index'


const compiledSchema = Schema.compile(schema)

export const previewUtils = _previewUtils // must be a better way, no?

export default createFormBuilder({
  schema: compiledSchema,
  resolveInputComponent: inputResolver,
  resolvePreviewComponent: previewResolver,
  resolveValidationComponent: () => ValidationList
})
