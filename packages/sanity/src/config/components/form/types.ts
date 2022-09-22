import React from 'react'
import {PreviewProps} from '../../../components/previews'
import {FieldProps, InputProps, ItemProps} from '../../../form'

export type FormComponentNames = 'Input' | 'Field' | 'Item' | 'Preview'

export interface FormComponents {
  Input: React.ComponentType<Omit<InputProps, 'renderNext'>>
  Field: React.ComponentType<Omit<FieldProps, 'renderNext'>>
  Item: React.ComponentType<Omit<ItemProps, 'renderNext'>>
  Preview: React.ComponentType<Omit<PreviewProps, 'renderNext'>>
}

export interface FormComponentsPluginOptions {
  Input?: React.ComponentType<InputProps>
  Field?: React.ComponentType<FieldProps>
  Item?: React.ComponentType<ItemProps>
  Preview?: React.ComponentType<PreviewProps>
}
