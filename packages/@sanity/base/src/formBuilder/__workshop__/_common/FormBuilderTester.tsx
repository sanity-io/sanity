import React from 'react'
import {LayerProvider, studioTheme, ThemeProvider, ToastProvider} from '@sanity/ui'
import type {Schema as SchemaSchema} from '@sanity/types'
import {FormBuilderProvider} from '../../FormBuilderProvider'
import {ReviewChangesContextProvider} from '../../sanity/contexts/reviewChanges/ReviewChangesProvider'
import {PatchChannel} from '../../patchChannel'
import {inputResolver} from './inputResolver'
import {resolvePreviewComponent} from './resolvePreviewComponent'

export interface FormBuilderTesterProps {
  value: any | null
  children: React.ReactElement
  schema: SchemaSchema
  isChangesOpen?: boolean
  patchChannel: PatchChannel
}

export function FormBuilderTester(props: FormBuilderTesterProps) {
  const {value, patchChannel, isChangesOpen = false} = props
  return (
    <ThemeProvider theme={studioTheme}>
      <LayerProvider>
        <ToastProvider>
          <ReviewChangesContextProvider changesOpen={isChangesOpen}>
            <FormBuilderProvider
              value={value}
              __internal_patchChannel={patchChannel}
              schema={props.schema}
              resolveInputComponent={inputResolver}
              resolvePreviewComponent={resolvePreviewComponent}
            >
              {props.children}
            </FormBuilderProvider>
          </ReviewChangesContextProvider>
        </ToastProvider>
      </LayerProvider>
    </ThemeProvider>
  )
}
