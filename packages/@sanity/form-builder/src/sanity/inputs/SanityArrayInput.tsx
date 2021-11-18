// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import React, {ForwardedRef, forwardRef} from 'react'
import formBuilderConfig from 'config:@sanity/form-builder'
import ArrayFunctions from 'part:@sanity/form-builder/input/array/functions'
import {resolveInitialValueForType} from '@sanity/initial-value-templates'
import {SchemaType} from '@sanity/types'
import resolveUploader from '../uploads/resolveUploader'
import ArrayInput, {Props} from '../../inputs/arrays/ArrayOfObjectsInput'
import {
  ArrayOfPrimitivesInput,
  Props as PrimitiveArrayInputProps,
} from '../../inputs/arrays/ArrayOfPrimitivesInput'
import * as is from '../../utils/is'
import {FileLike} from '../uploads/types'
import SanityArrayItemReferenceInput from './reference/SanityArrayItemReferenceInput'

const arrayResolveUploader = (type: SchemaType, file: FileLike) => {
  const SUPPORT_DIRECT_IMAGE_UPLOADS = formBuilderConfig?.images?.directUploads
  const SUPPORT_DIRECT_FILE_UPLOADS = formBuilderConfig?.files?.directUploads
  if (is.type('image', type) && !SUPPORT_DIRECT_IMAGE_UPLOADS) {
    return null
  }
  if (is.type('file', type) && !SUPPORT_DIRECT_FILE_UPLOADS) {
    return null
  }
  return resolveUploader(type, file)
}

export const SanityArrayInput = forwardRef(function SanityArrayInput(
  props: Props,
  ref: ForwardedRef<ArrayInput>
) {
  return (
    <ArrayInput
      {...props}
      ref={ref}
      ReferenceItemComponent={SanityArrayItemReferenceInput}
      resolveUploader={arrayResolveUploader}
      resolveInitialValue={resolveInitialValueForType}
      ArrayFunctionsImpl={ArrayFunctions}
    />
  )
})

export const SanityArrayOfPrimitivesInput = forwardRef(function SanityArrayOfPrimitivesInput(
  props: Omit<PrimitiveArrayInputProps, 'ArrayFunctionsImpl'>,
  ref: ForwardedRef<ArrayOfPrimitivesInput>
) {
  return <ArrayOfPrimitivesInput {...props} ArrayFunctionsImpl={ArrayFunctions} ref={ref} />
})
