import React from 'react'
import {ItemProps} from './itemProps'
import {FieldProps} from './fieldProps'
import {InputProps} from './inputProps'

export type RenderArrayItemCallback = (itemProps: ItemProps) => React.ReactNode

export type RenderFieldCallback<T extends FieldProps = FieldProps> = (
  fieldProps: T
) => React.ReactNode

export type RenderInputCallback<T extends InputProps = InputProps> = (
  inputProps: T
) => React.ReactNode
