import React from 'react'
import {Item} from './item'
import {FieldProps} from './fieldProps'
import {InputProps} from './inputProps'

export type RenderItemCallback = (item: Item) => React.ReactNode

export type RenderFieldCallback<T extends FieldProps = FieldProps> = (
  fieldProps: T
) => React.ReactNode

export type RenderInputCallback<T extends InputProps = InputProps> = (
  inputProps: T
) => React.ReactNode
