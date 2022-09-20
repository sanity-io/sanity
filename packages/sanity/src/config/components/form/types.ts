import {ComponentType} from 'react'
import {PreviewProps} from '../../../components/previews'
import {InputProps, FieldProps, ItemProps} from '../../../form'

export type ComponentNames = 'Input' | 'Preview' | 'Field' | 'Item'
export type CallbackNames = 'renderInput' | 'renderField' | 'renderPreview' | 'renderItem'

export interface FormComponents {
  Input: ComponentType<Omit<InputProps, 'renderInput'>>
  Field: ComponentType<Omit<FieldProps, 'renderField'>>
  Preview: ComponentType<Omit<PreviewProps, 'renderPreview'>>
  Item: ComponentType<Omit<ItemProps, 'renderItem'>>
}

export interface FormComponentsPluginOptions {
  Input?: ComponentType<InputProps>
  Field?: ComponentType<FieldProps>
  Preview?: ComponentType<PreviewProps>
  Item?: ComponentType<ItemProps>
}
