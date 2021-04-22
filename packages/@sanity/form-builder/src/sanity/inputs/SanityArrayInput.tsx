import React, {ForwardedRef, forwardRef} from 'react'
import formBuilderConfig from 'config:@sanity/form-builder'
import ArrayFunctions from 'part:@sanity/form-builder/input/array/functions'
import resolveUploader from '../uploads/resolveUploader'
import ArrayInput, {Props} from '../../inputs/arrays/ArrayOfObjectsInput'
import {
  ArrayOfPrimitivesInput,
  Props as PrimitiveArrayInputProps,
} from '../../inputs/arrays/ArrayOfPrimitivesInput'

const SUPPORT_DIRECT_UPLOADS = formBuilderConfig?.images?.directUploads

export const SanityArrayInput = forwardRef(function SanityArrayInput(
  props: Props,
  ref: ForwardedRef<ArrayInput>
) {
  return (
    <ArrayInput
      {...props}
      ref={ref}
      resolveUploader={resolveUploader}
      ArrayFunctionsImpl={ArrayFunctions}
      directUploads={SUPPORT_DIRECT_UPLOADS}
    />
  )
})

export const SanityArrayOfPrimitivesInput = forwardRef(function SanityArrayOfPrimitivesInput(
  props: Omit<PrimitiveArrayInputProps, 'ArrayFunctionsImpl'>,
  ref: ForwardedRef<ArrayOfPrimitivesInput>
) {
  return <ArrayOfPrimitivesInput {...props} ArrayFunctionsImpl={ArrayFunctions} ref={ref} />
})
