import React from 'react'
import {LayerProvider, studioTheme, ThemeProvider, ToastProvider} from '@sanity/ui'
import {FormBuilderProvider} from '../../FormBuilderProvider'
import {ReviewChangesContextProvider} from '../../studio/contexts/reviewChanges/ReviewChangesProvider'
import {PatchChannel} from '../../patch/PatchChannel'
import {useSource} from '../../../studio'
// import {inputResolver} from './inputResolver'
// import {resolvePreviewComponent} from './resolvePreviewComponent'

export interface FormBuilderTesterProps {
  value: any | null
  children: React.ReactElement
  isChangesOpen?: boolean
  patchChannel: PatchChannel
}

export function FormBuilderTester(props: FormBuilderTesterProps) {
  const {value, patchChannel, isChangesOpen = false} = props
  const {formBuilder} = useSource()
  return (
    <ThemeProvider theme={studioTheme}>
      <LayerProvider>
        <ToastProvider>
          <ReviewChangesContextProvider changesOpen={isChangesOpen}>
            <FormBuilderProvider
              __internal_patchChannel={patchChannel}
              onChange={() => undefined}
              value={value}
              {...formBuilder}
            >
              {props.children}
            </FormBuilderProvider>
          </ReviewChangesContextProvider>
        </ToastProvider>
      </LayerProvider>
    </ThemeProvider>
  )
}
