import React from 'react'
import {LayerProvider, studioTheme, ThemeProvider, ToastProvider} from '@sanity/ui'
import type {Schema as SchemaSchema} from '@sanity/types'
import FormBuilderContext from '../../FormBuilderContext'
import type {PatchChannelOptions} from '../../FormBuilderContext'
import {inputResolver} from './inputResolver'
import {resolvePreviewComponent} from './resolvePreviewComponent'

export type FormBuilderOptions = {
  value: any | null
  children: React.ReactElement
  schema: SchemaSchema
  patchChannel: PatchChannelOptions
}

export function FormBuilderTester(props: FormBuilderOptions) {
  const {value, patchChannel} = props
  return (
    <ThemeProvider scheme="light" theme={studioTheme}>
      <LayerProvider>
        <ToastProvider>
          <FormBuilderContext
            value={value}
            patchChannel={patchChannel}
            schema={props.schema}
            resolveInputComponent={inputResolver}
            resolvePreviewComponent={resolvePreviewComponent}
          >
            {props.children}
          </FormBuilderContext>
        </ToastProvider>
      </LayerProvider>
    </ThemeProvider>
  )
}
