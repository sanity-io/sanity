import {useSanity} from '@sanity/base'
import {FormPreviewComponentResolver} from '@sanity/base/form'
import {SanityPreview} from '@sanity/base/preview'
import {Schema, SchemaType} from '@sanity/types'
import React, {useCallback} from 'react'
import {FormBuilderProvider} from '../FormBuilderProvider'
import {PatchChannel} from '../patchChannel'
import {resolveInputComponent as defaultInputResolver} from './inputResolver/inputResolver'

const previewResolver: FormPreviewComponentResolver = (..._: unknown[]) => {
  // @todo: Implement correct typing here
  return SanityPreview as any
}

/**
 * @alpha This API might change.
 */
export interface SanityFormBuilderProviderProps {
  /**
   * @internal Considered internal, do not use.
   */
  __internal_patchChannel: PatchChannel // eslint-disable-line camelcase
  children: React.ReactElement
  schema: Schema
  value: any | null
}

/**
 * Default wiring for `FormBuilderProvider` when used with Sanity
 *
 * @alpha This API might change.
 */
export function SanityFormBuilderProvider(props: SanityFormBuilderProviderProps) {
  const {__internal_patchChannel: patchChannel, children, schema, value} = props

  // Load Sanity config
  const {formBuilder} = useSanity()

  const resolveInputComponent = useCallback(
    (type: SchemaType) => {
      return defaultInputResolver(
        formBuilder.components?.inputs || {},
        formBuilder.resolveInputComponent,
        type
      )
    },
    [formBuilder]
  )

  return (
    <FormBuilderProvider
      __internal_patchChannel={patchChannel}
      components={formBuilder.components}
      file={formBuilder.file}
      image={formBuilder.image}
      resolveInputComponent={resolveInputComponent}
      resolvePreviewComponent={formBuilder.resolvePreviewComponent || previewResolver}
      schema={schema}
      value={value}
    >
      {children}
    </FormBuilderProvider>
  )
}
