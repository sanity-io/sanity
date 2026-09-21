import {lazy, Suspense} from 'react'

import {Preview} from '../../preview/components/Preview'
import {
  type RenderAnnotationCallback,
  type RenderBlockCallback,
  type RenderFieldCallback,
  type RenderInputCallback,
  type RenderItemCallback,
  type RenderPreviewCallback,
} from '../types/renderCallback'

// These callbacks resolve the default component for a schema type and render it, which reaches
// every default input, field and item component (the whole form runtime, including the Portable
// Text editor). Nothing in the studio calls them before a document form is rendered, but they are
// exported from `sanity`, so the resolvers are imported on first use rather than statically:
// otherwise every studio downloads the form runtime before it can show the login screen (with
// `autoUpdates: true` the entry's static import graph is fetched through the import map and
// nothing in it is tree-shaken). The studio's own form uses `FormBuilder`, which imports the
// resolvers directly.

const DefaultAnnotation = lazy(() =>
  import('./inputResolver/blockResolver').then((module) => ({
    default: function DefaultAnnotation(props: Parameters<RenderAnnotationCallback>[0]) {
      const Annotation = module.defaultResolveAnnotationComponent(props.schemaType)
      return <Annotation {...props} />
    },
  })),
)

/** @internal */
export const defaultRenderAnnotation: RenderAnnotationCallback = (props) => (
  <Suspense fallback={null}>
    <DefaultAnnotation {...props} />
  </Suspense>
)

const DefaultBlock = lazy(() =>
  import('./inputResolver/blockResolver').then((module) => ({
    default: function DefaultBlock(props: Parameters<RenderBlockCallback>[0]) {
      const Block = module.defaultResolveBlockComponent(props.schemaType)
      return <Block {...props} />
    },
  })),
)

/** @internal */
export const defaultRenderBlock: RenderBlockCallback = (props) => (
  <Suspense fallback={null}>
    <DefaultBlock {...props} />
  </Suspense>
)

const DefaultInlineBlock = lazy(() =>
  import('./inputResolver/blockResolver').then((module) => ({
    default: function DefaultInlineBlock(props: Parameters<RenderBlockCallback>[0]) {
      const InlineBlock = module.defaultResolveInlineBlockComponent(props.schemaType)
      return <InlineBlock {...props} />
    },
  })),
)

/** @internal */
export const defaultRenderInlineBlock: RenderBlockCallback = (props) => (
  <Suspense fallback={null}>
    <DefaultInlineBlock {...props} />
  </Suspense>
)

const DefaultField = lazy(() =>
  import('./inputResolver/fieldResolver').then((module) => ({
    default: function DefaultField(props: Parameters<RenderFieldCallback>[0]) {
      const Field = module.defaultResolveFieldComponent(props.schemaType)
      return <Field {...props} />
    },
  })),
)

/** @internal */
export const defaultRenderField: RenderFieldCallback = (props) => (
  <Suspense fallback={null}>
    <DefaultField {...props} />
  </Suspense>
)

const DefaultInput = lazy(() =>
  import('./inputResolver/inputResolver').then((module) => ({
    default: function DefaultInput(props: Parameters<RenderInputCallback>[0]) {
      const Input = module.defaultResolveInputComponent(props.schemaType)
      return <Input {...props} />
    },
  })),
)

/** @internal */
export const defaultRenderInput: RenderInputCallback = (props) => (
  <Suspense fallback={null}>
    <DefaultInput {...props} />
  </Suspense>
)

const DefaultItem = lazy(() =>
  import('./inputResolver/itemResolver').then((module) => ({
    default: function DefaultItem(props: Parameters<RenderItemCallback>[0]) {
      const Item = module.defaultResolveItemComponent(props.schemaType)
      return <Item {...props} />
    },
  })),
)

/** @internal */
export const defaultRenderItem: RenderItemCallback = (props) => (
  <Suspense fallback={null}>
    <DefaultItem {...props} />
  </Suspense>
)

/** @internal */
export const defaultRenderPreview: RenderPreviewCallback = (props) => {
  return <Preview {...props} />
}
