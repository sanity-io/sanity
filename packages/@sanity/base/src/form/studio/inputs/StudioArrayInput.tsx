import React, {ForwardedRef, forwardRef, useCallback} from 'react'
import {SchemaType} from '@sanity/types'
import {resolveUploader as defaultResolveUploader} from '../uploads/resolveUploader'
import {ArrayInput} from '../../inputs/arrays/ArrayOfObjectsInput'
import {ArrayOfPrimitivesInput} from '../../inputs/arrays/ArrayOfPrimitivesInput'
import * as is from '../../utils/is'
import {useFormBuilder} from '../../useFormBuilder'
import {ArrayOfObjectsInputProps, ArrayOfPrimitivesInputProps} from '../../types'
import {resolveInitialValueForType} from '../../../templates'
import {FileLike, UploaderResolver} from '../uploads/types'
import {useSource} from '../../../studio'

export const StudioArrayInput = forwardRef(function StudioArrayInput(
  props: ArrayOfObjectsInputProps & {resolveUploader: UploaderResolver}
  // ref: ForwardedRef<typeof ArrayInput>
) {
  const formBuilder = useFormBuilder()
  // todo abstract the client away
  const {client} = useSource()
  const supportsImageUploads = formBuilder.__internal.image.directUploads
  const supportsFileUploads = formBuilder.__internal.file.directUploads

  const resolveUploader = useCallback(
    (type: SchemaType, file: FileLike) => {
      if (is.type('image', type) && !supportsImageUploads) {
        return null
      }
      if (is.type('file', type) && !supportsFileUploads) {
        return null
      }

      return defaultResolveUploader(type, file)
    },
    [supportsFileUploads, supportsImageUploads]
  )

  return (
    <ArrayInput
      {...props}
      resolveInitialValue={resolveInitialValueForType}
      resolveUploader={resolveUploader}
      client={client}
    />
  )
})

export const StudioArrayOfPrimitivesInput = forwardRef(function StudioArrayOfPrimitivesInput(
  props: Omit<ArrayOfPrimitivesInputProps, 'ArrayFunctionsImpl'>,
  ref: ForwardedRef<ArrayOfPrimitivesInput>
) {
  const formBuilder = useFormBuilder()

  return (
    <ArrayOfPrimitivesInput
      {...props}
      ArrayFunctionsImpl={formBuilder.__internal.components.ArrayFunctions}
      ref={ref}
    />
  )
})
