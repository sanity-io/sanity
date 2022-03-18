import {SanityFormBuilderConfig} from '@sanity/base'
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
export interface SanityFormBuilderProviderProps extends SanityFormBuilderConfig {
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
  const {
    __internal_patchChannel: patchChannel,
    components,
    resolveInputComponent: resolveInputComponentProp,
    resolvePreviewComponent = previewResolver,
  } = props

  const resolveInputComponent = useCallback(
    (type: SchemaType) => {
      return defaultInputResolver(components?.inputs || {}, resolveInputComponentProp, type)
    },
    [components?.inputs, resolveInputComponentProp]
  )

  return (
    <FormBuilderProvider
      __internal_patchChannel={patchChannel}
      components={components}
      resolveInputComponent={resolveInputComponent}
      resolvePreviewComponent={resolvePreviewComponent}
      schema={props.schema}
      value={props.value}
    >
      {props.children}
    </FormBuilderProvider>
  )
}
