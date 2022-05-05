import React, {ForwardedRef, forwardRef} from 'react'
import {SchemaType} from '@sanity/types'
import {resolveUploader as sanityResolveUploader} from '../uploads/resolveUploader'
import {ArrayInput} from '../../inputs/arrays/ArrayOfObjectsInput'
import {ArrayOfPrimitivesInput} from '../../inputs/arrays/ArrayOfPrimitivesInput'
import * as is from '../../utils/is'
import {FileLike} from '../uploads/types'
import {FormBuilderContextValue} from '../../FormBuilderContext'
import {useFormBuilder} from '../../useFormBuilder'
import {ArrayOfObjectsInputProps, ArrayOfPrimitivesInputProps, FIXME} from '../../types'
import {resolveInitialValueForType} from '../../../templates'

const arrayResolveUploader = (
  formBuilder: FormBuilderContextValue,
  type: SchemaType,
  file: FileLike
) => {
  const SUPPORT_DIRECT_IMAGE_UPLOADS = formBuilder.image.directUploads
  const SUPPORT_DIRECT_FILE_UPLOADS = formBuilder.file.directUploads
  if (is.type('image', type) && !SUPPORT_DIRECT_IMAGE_UPLOADS) {
    return null
  }
  if (is.type('file', type) && !SUPPORT_DIRECT_FILE_UPLOADS) {
    return null
  }
  return sanityResolveUploader(type, file)
}

export const StudioArrayInput = forwardRef(function StudioArrayInput(
  props: ArrayOfObjectsInputProps,
  ref: ForwardedRef<typeof ArrayInput>
) {
  // // const formBuilder = useFormBuilder()
  //
  // const resolveUploader = useCallback(
  //   (type: SchemaType, file: FileLike) => {
  //     return arrayResolveUploader(formBuilder, type, file)
  //   },
  //   [formBuilder]
  // )

  return <ArrayInput {...props} resolveInitialValue={resolveInitialValueForType} />
})

export const StudioArrayOfPrimitivesInput = forwardRef(function StudioArrayOfPrimitivesInput(
  props: Omit<ArrayOfPrimitivesInputProps, 'ArrayFunctionsImpl'>,
  ref: ForwardedRef<ArrayOfPrimitivesInput>
) {
  const formBuilder = useFormBuilder()

  return (
    <ArrayOfPrimitivesInput
      {...props}
      ArrayFunctionsImpl={formBuilder.components.ArrayFunctions as FIXME}
      ref={ref}
    />
  )
})
