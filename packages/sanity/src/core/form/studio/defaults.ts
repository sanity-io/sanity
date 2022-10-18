import {createElement} from 'react'
import {
  RenderFieldCallback,
  RenderInputCallback,
  RenderItemCallback,
  RenderPreviewCallback,
} from '../types'
import {
  defaultResolveInputComponent,
  defaultResolvePreviewComponent,
} from './inputResolver/inputResolver'
import {defaultResolveItemComponent} from './inputResolver/itemResolver'
import {defaultResolveFieldComponent} from './inputResolver/fieldResolver'

/** @internal */
export const defaultRenderField: RenderFieldCallback = (props) => {
  return createElement(defaultResolveFieldComponent(props.schemaType), props)
}

/** @internal */
export const defaultRenderInput: RenderInputCallback = (props) => {
  return createElement(defaultResolveInputComponent(props.schemaType), props)
}

/** @internal */
export const defaultRenderItem: RenderItemCallback = (props) => {
  return createElement(defaultResolveItemComponent(props.schemaType), props)
}

/** @internal */
export const defaultRenderPreview: RenderPreviewCallback = (props) => {
  return createElement(defaultResolvePreviewComponent(), props)
}
