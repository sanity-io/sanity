import React from 'react'
import schema from 'part:@sanity/base/schema'

import inputResolver from './inputResolver/inputResolver'
import SanityPreview from 'part:@sanity/base/preview'
import ValidationList from 'part:@sanity/form-builder/validation-list'
import * as patches from '../utils/patches'

import {FormBuilder, defaultConfig} from '../'

export {default as WithFormBuilderValue} from './WithFormBuilderValue'
export {default as withDocument} from '../utils/withDocument'
export {checkout} from './formBuilderValueStore'
export {default as PatchEvent} from '../PatchEvent'
export {FormBuilderInput} from '../FormBuilderInput'

export {patches}

export default function SanityFormBuilder(props) {
  return (
    <FormBuilder
      {...props}
      schema={schema}
      resolveInputComponent={inputResolver}
      resolvePreviewComponent={SanityPreview}
      resolveValidationComponent={ValidationList}
    />)

}

export {inputResolver, defaultConfig}
