import {lazy, Suspense} from 'react'

import {LoadingBlock} from '../components/loadingBlock/LoadingBlock'
import {type FormBuilderProps} from './studio/FormBuilder'
import {type FormProviderProps} from './studio/FormProvider'
import {type PortableTextInputProps} from './types/inputProps'

// Code-split facades for the form components that `sanity` exports. The form runtime and the
// Portable Text editor are the largest part of the package, and nothing renders them before a
// document is opened, yet every studio downloaded them up front because these components are
// statically reachable from the entry (with `autoUpdates: true` the entry graph is fetched
// through the import map and nothing in it is tree-shaken). Only the public exports go through
// these wrappers, which keep the implementation's name and props and load it on first render
// behind a `Suspense` of their own; internal code keeps importing the implementations directly,
// so the default rendering path is unchanged.

const LazyFormBuilder = lazy(() =>
  import('./studio/FormBuilder').then((module) => ({default: module.FormBuilder})),
)

/**
 * @alpha
 */
export function FormBuilder(props: FormBuilderProps): React.JSX.Element {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <LazyFormBuilder {...props} />
    </Suspense>
  )
}

const LazyFormProvider = lazy(() =>
  import('./studio/FormProvider').then((module) => ({default: module.FormProvider})),
)

/**
 * @alpha This API might change.
 */
export function FormProvider(props: FormProviderProps): React.JSX.Element {
  return (
    <Suspense fallback={null}>
      <LazyFormProvider {...props} />
    </Suspense>
  )
}

const LazyPortableTextInput = lazy(() =>
  import('./inputs/PortableText/PortableTextInput').then((module) => ({
    default: module.PortableTextInput,
  })),
)

/**
 * Input component for editing block content
 * ({@link https://github.com/portabletext/portabletext | Portable Text}) in the Sanity Studio.
 *
 * Supports multi-user real-time block content editing on larger documents.
 *
 * This component can be configured and customized extensively.
 * {@link https://www.sanity.io/docs/customizing-the-portable-text-editor | Go to the documentation for more details}.
 *
 * @public
 * @param props - {@link PortableTextInputProps} component props.
 */
export function PortableTextInput(props: PortableTextInputProps): React.JSX.Element {
  return (
    <Suspense fallback={null}>
      <LazyPortableTextInput {...props} />
    </Suspense>
  )
}

const LazyUpdateReadOnlyPlugin = lazy(() =>
  import('./inputs/PortableText/PortableTextInput').then((module) => ({
    default: module.UpdateReadOnlyPlugin,
  })),
)

/**
 * Sets the editor's read-only state; renders nothing. Must be rendered inside a Portable Text
 * editor.
 *
 * @internal
 */
export function UpdateReadOnlyPlugin(props: {readOnly: boolean}): React.JSX.Element {
  return (
    <Suspense fallback={null}>
      <LazyUpdateReadOnlyPlugin {...props} />
    </Suspense>
  )
}
