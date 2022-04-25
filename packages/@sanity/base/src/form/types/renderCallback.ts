import * as React from 'react'
import {ObjectInputProps} from '../types'
import {FieldProps} from './fieldProps'
import {FieldSetProps} from './fieldsetProps'

export type RenderFieldCallbackArg = FieldProps & {
  focusRef: React.Ref<any>
}

export type RenderFieldCallback = (renderFieldProps: RenderFieldCallbackArg) => React.ReactNode

export type RenderArrayItemCallback = (
  renderArrayItemProps: RenderArrayItemCallbackArg
) => React.ReactNode

export type RenderArrayItemCallbackArg = ObjectInputProps & {
  focusRef: React.Ref<any>
}

export type RenderFieldSetCallback = (
  renderFieldSetProps: RenderFieldSetCallbackArg
) => React.ReactNode

export type RenderFieldSetCallbackArg = FieldSetProps & {
  children?: React.ReactNode
}
