import {createElement} from 'react'

import {Preview} from '../../preview/components/Preview'
import {
  type RenderAnnotationCallback,
  type RenderBlockCallback,
  type RenderFieldCallback,
  type RenderInputCallback,
  type RenderItemCallback,
  type RenderPreviewCallback,
} from '../types'
import {
  defaultResolveAnnotationComponent,
  defaultResolveBlockComponent,
  defaultResolveInlineBlockComponent,
} from './inputResolver/blockResolver'
import {defaultResolveFieldComponent} from './inputResolver/fieldResolver'
import {defaultResolveInputComponent} from './inputResolver/inputResolver'
import {defaultResolveItemComponent} from './inputResolver/itemResolver'

/** @internal */
export const defaultRenderAnnotation: RenderAnnotationCallback = (props) => {
  // @TODO should use JSX instead of calling createElement directly
  return createElement(defaultResolveAnnotationComponent(props.schemaType), props)
}

/** @internal */
export const defaultRenderBlock: RenderBlockCallback = (props) => {
  // @TODO should use JSX instead of calling createElement directly
  return createElement(defaultResolveBlockComponent(props.schemaType), props)
}

/** @internal */
export const defaultRenderInlineBlock: RenderBlockCallback = (props) => {
  // @TODO should use JSX instead of calling createElement directly
  return createElement(defaultResolveInlineBlockComponent(props.schemaType), props)
}

/** @internal */
export const defaultRenderField: RenderFieldCallback = (props) => {
  // @TODO should use JSX instead of calling createElement directly
  return createElement(defaultResolveFieldComponent(props.schemaType), props)
}

/** @internal */
export const defaultRenderInput: RenderInputCallback = (props) => {
  // @TODO should use JSX instead of calling createElement directly
  return createElement(defaultResolveInputComponent(props.schemaType), props)
}

/** @internal */
export const defaultRenderItem: RenderItemCallback = (props) => {
  // @TODO should use JSX instead of calling createElement directly
  return createElement(defaultResolveItemComponent(props.schemaType), props)
}

/** @internal */
export const defaultRenderPreview: RenderPreviewCallback = (props) => {
  // @TODO should use JSX instead of calling createElement directly
  return createElement(Preview, props)
}
