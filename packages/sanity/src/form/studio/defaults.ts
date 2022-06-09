import {createElement} from 'react'
import {
  RenderFieldCallback,
  RenderInputCallback,
  RenderItemCallback,
  RenderPreviewCallback,
} from '../types'
import {
  defaultResolveFieldComponent,
  defaultResolveInputComponent,
  defaultResolveItemComponent,
  defaultResolvePreviewComponent,
} from './inputResolver/inputResolver'

export const defaultRenderField: RenderFieldCallback = (props) => {
  return createElement(defaultResolveFieldComponent(props.schemaType), props)
}

export const defaultRenderInput: RenderInputCallback = (props) => {
  return createElement(defaultResolveInputComponent(props.schemaType), props)
}

export const defaultRenderItem: RenderItemCallback = (props) => {
  return createElement(defaultResolveItemComponent(props.schemaType), props)
}

export const defaultRenderPreview: RenderPreviewCallback = (props) => {
  return createElement(defaultResolvePreviewComponent(props.schemaType), props)
}
