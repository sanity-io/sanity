import {createElement} from 'react'
import {
  RenderFieldCallback,
  RenderInputCallback,
  RenderItemCallback,
  RenderPreviewCallback,
  RenderDiffCallback,
} from '../types'
import {
  defaultResolveDiffComponent,
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
  return createElement(defaultResolvePreviewComponent(), props)
}

export const defaultRenderDiff: RenderDiffCallback = (props) => {
  return createElement(defaultResolveDiffComponent(props.schemaType), props)
}
