import {createElement} from 'react'
import {DiffComponent} from '../../field'
import {isRecord} from '../../util'
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
  const diffComponent = defaultResolveDiffComponent(props.schemaType)

  if (isRecord(diffComponent) && diffComponent?.component) {
    return createElement(diffComponent.component, props)
  } else if (diffComponent) {
    return createElement(diffComponent as DiffComponent, props)
  }

  return null
}
