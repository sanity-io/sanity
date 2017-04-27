import schema from 'part:@sanity/base/schema'
import inputResolver from './inputResolver/inputResolver'
import SanityPreview from 'part:@sanity/base/preview'
import ValidationList from 'part:@sanity/form-builder/validation-list'
import * as patches from '../utils/patches'

import {createFormBuilder, defaultConfig} from '../index'
export {default as WithFormBuilderValue} from './WithFormBuilderValue'
export {checkout} from './formBuilderValueStore'
export {default as PatchEvent} from '../PatchEvent'

export {patches}

export default createFormBuilder({
  schema: schema,
  resolveInputComponent: inputResolver,
  resolvePreviewComponent: () => SanityPreview,
  resolveValidationComponent: () => ValidationList
})

export {createFormBuilder, inputResolver, defaultConfig}
