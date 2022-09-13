import React, {ForwardedRef, forwardRef, useCallback} from 'react'
import {SchemaType} from '@sanity/types'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../studioClient'
import {resolveUploader as defaultResolveUploader} from '../uploads/resolveUploader'
import {ArrayInput} from '../../inputs/arrays/ArrayOfObjectsInput'
import {ArrayOfPrimitivesInput} from '../../inputs/arrays/ArrayOfPrimitivesInput'
import * as is from '../../utils/is'
import {useFormBuilder} from '../../useFormBuilder'
import {useClient} from '../../../hooks'
import {ArrayOfObjectsInputProps, ArrayOfPrimitivesInputProps} from '../../types'
import {FileLike} from '../uploads/types'
import {useResolveInitialValueForType} from '../../../datastores'

export function StudioArrayInput(props: ArrayOfObjectsInputProps) {
  const formBuilder = useFormBuilder()
  // todo abstract the client away
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
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

  const resolveInitialValue = useResolveInitialValueForType()

  return (
    <ArrayInput
      {...props}
      resolveInitialValue={resolveInitialValue}
      resolveUploader={resolveUploader}
      client={client}
    />
  )
}

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
