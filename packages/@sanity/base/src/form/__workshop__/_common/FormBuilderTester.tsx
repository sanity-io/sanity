import React from 'react'
import {LayerProvider, studioTheme, ThemeProvider, ToastProvider} from '@sanity/ui'
import type {ObjectSchemaType, Schema} from '@sanity/types'
import {FormBuilderProvider} from '../../FormBuilderProvider'
import {ReviewChangesContextProvider} from '../../studio/contexts/reviewChanges/ReviewChangesProvider'
import {PatchChannel} from '../../patch/PatchChannel'
import {inputResolver} from './inputResolver'
import {resolvePreviewComponent} from './resolvePreviewComponent'

export interface FormBuilderTesterProps {
  value: any | null
  children: React.ReactElement
  schema: Schema
  isChangesOpen?: boolean
  patchChannel: PatchChannel
  type: ObjectSchemaType
}

export function FormBuilderTester(props: FormBuilderTesterProps) {
  const {value, patchChannel, isChangesOpen = false, type} = props
  return (
    <ThemeProvider theme={studioTheme}>
      <LayerProvider>
        <ToastProvider>
          <ReviewChangesContextProvider changesOpen={isChangesOpen}>
            <FormBuilderProvider
              value={value}
              __internal_patchChannel={patchChannel}
              schema={props.schema}
              renderField={() => <>TODO</>}
              resolveInputComponent={inputResolver}
              resolvePreviewComponent={resolvePreviewComponent}
              type={type}
            >
              {props.children}
            </FormBuilderProvider>
          </ReviewChangesContextProvider>
        </ToastProvider>
      </LayerProvider>
    </ThemeProvider>
  )
}
