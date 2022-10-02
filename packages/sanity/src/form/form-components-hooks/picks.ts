import {ComponentType} from 'react'
import {PreviewProps} from '../../components/previews'
import {PluginOptions} from '../../config'
import {FieldProps, InputProps, ItemProps} from '../types'

export function pickInputComponent(plugin: PluginOptions): ComponentType<InputProps> {
  return plugin.form?.components?.input as ComponentType<InputProps>
}

export function pickFieldComponent(plugin: PluginOptions): ComponentType<FieldProps> {
  return plugin.form?.components?.field as ComponentType<FieldProps>
}

export function pickPreviewComponent(plugin: PluginOptions): ComponentType<PreviewProps> {
  return plugin.form?.components?.preview as ComponentType<PreviewProps>
}

export function pickItemComponent(plugin: PluginOptions): ComponentType<ItemProps> {
  return plugin.form?.components?.item as ComponentType<ItemProps>
}
