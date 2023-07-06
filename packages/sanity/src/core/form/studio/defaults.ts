import {createElement} from 'react'
import {
  RenderAnnotationCallback,
  RenderBlockCallback,
  RenderFieldCallback,
  RenderInputCallback,
  RenderItemCallback,
  RenderPreviewCallback,
} from '../types'
import {Preview} from '../../preview/components/Preview'
import {defaultResolveInputComponent} from './inputResolver/inputResolver'
import {defaultResolveItemComponent} from './inputResolver/itemResolver'
import {defaultResolveFieldComponent} from './inputResolver/fieldResolver'
import {
  defaultResolveAnnotationComponent,
  defaultResolveBlockComponent,
  defaultResolveInlineBlockComponent,
} from './inputResolver/blockResolver'

/** @internal */
export const defaultRenderAnnotation: RenderAnnotationCallback = (props) => {
  return createElement(defaultResolveAnnotationComponent(props.schemaType), props)
}

/** @internal */
export const defaultRenderBlock: RenderBlockCallback = (props) => {
  return createElement(defaultResolveBlockComponent(props.schemaType), props)
}

/** @internal */
export const defaultRenderInlineBlock: RenderBlockCallback = (props) => {
  return createElement(defaultResolveInlineBlockComponent(props.schemaType), props)
}

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
  return createElement(Preview, props)
}
