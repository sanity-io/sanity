import React from 'react'
import {LayerProvider, studioTheme, ThemeProvider, ToastProvider} from '@sanity/ui'
import type {Schema as SchemaSchema} from '@sanity/types'
import FormBuilderContext from '../../FormBuilderContext'
import type {PatchChannelOptions} from '../../FormBuilderContext'
import {ReviewChangesContextProvider} from '../../sanity/contexts/reviewChanges/ReviewChangesProvider'
import {inputResolver} from './inputResolver'
import {resolvePreviewComponent} from './resolvePreviewComponent'

export type FormBuilderOptions = {
  value: any | null
  children: React.ReactElement
  schema: SchemaSchema
  isChangesOpen?: boolean
  patchChannel: PatchChannelOptions
}

export function FormBuilderTester(props: FormBuilderOptions) {
  const {value, patchChannel, isChangesOpen = false} = props
  return (
    <ThemeProvider scheme="light" theme={studioTheme}>
      <LayerProvider>
        <ToastProvider>
          <ReviewChangesContextProvider changesOpen={isChangesOpen}>
            <FormBuilderContext
              value={value}
              patchChannel={patchChannel}
              schema={props.schema}
              resolveInputComponent={inputResolver}
              resolvePreviewComponent={resolvePreviewComponent}
            >
              {props.children}
            </FormBuilderContext>
          </ReviewChangesContextProvider>
        </ToastProvider>
      </LayerProvider>
    </ThemeProvider>
  )
}
