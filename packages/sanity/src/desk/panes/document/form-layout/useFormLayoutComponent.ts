import {ComponentType} from 'react'
import {FormLayout} from './FormLayout'
import {FormLayoutProps, PluginOptions, useMiddlewareComponents} from 'sanity'

function pickFormLayout(plugin: PluginOptions) {
  return plugin.form?.components?.layout as ComponentType<Omit<FormLayoutProps, 'renderDefault'>>
}

/**
 * A hook that returns the form layout components composed
 * by the Components API (`form.components.layout`).
 */
export function useFormLayoutComponent(): ComponentType<Omit<FormLayoutProps, 'renderDefault'>> {
  return useMiddlewareComponents({
    pick: pickFormLayout,
    defaultComponent: FormLayout,
  })
}
