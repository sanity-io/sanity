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
  const Annotation = defaultResolveAnnotationComponent(props.schemaType)
  return <Annotation {...props} />
}

/** @internal */
export const defaultRenderBlock: RenderBlockCallback = (props) => {
  const Block = defaultResolveBlockComponent(props.schemaType)
  return <Block {...props} />
}

/** @internal */
export const defaultRenderInlineBlock: RenderBlockCallback = (props) => {
  const InlineBlock = defaultResolveInlineBlockComponent(props.schemaType)
  return <InlineBlock {...props} />
}

/** @internal */
export const defaultRenderField: RenderFieldCallback = (props) => {
  const Field = defaultResolveFieldComponent(props.schemaType)
  return <Field {...props} />
}

/** @internal */
export const defaultRenderInput: RenderInputCallback = (props) => {
  const Input = defaultResolveInputComponent(props.schemaType)
  return <Input {...props} />
}

/** @internal */
export const defaultRenderItem: RenderItemCallback = (props) => {
  const Item = defaultResolveItemComponent(props.schemaType)
  return <Item {...props} />
}

/** @internal */
export const defaultRenderPreview: RenderPreviewCallback = (props) => {
  return <Preview {...props} />
}
