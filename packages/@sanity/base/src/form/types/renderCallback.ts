import React from 'react'
import {ObjectItemProps, PrimitiveItemProps} from './itemProps'
import {FieldProps} from './fieldProps'
import {InputProps} from './inputProps'

export type RenderArrayItemCallback = (itemProps: ObjectItemProps) => React.ReactNode
export type RenderPrimitiveArrayItemCallback = (itemProps: PrimitiveItemProps) => React.ReactNode

export type RenderFieldCallback<T extends FieldProps = FieldProps> = (
  fieldProps: T
) => React.ReactNode

export type RenderInputCallback<T extends InputProps = InputProps> = (
  inputProps: T
) => React.ReactNode
