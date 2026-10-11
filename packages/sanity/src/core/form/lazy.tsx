import {type ArraySchemaType} from '@sanity/types'
import {type ComponentProps, lazy, Suspense} from 'react'

import {LoadingBlock} from '../components/loadingBlock/LoadingBlock'
import {type FormField as FormFieldImplementation} from './components/formField/FormField'
import {type FormFieldHeaderTextProps} from './components/formField/FormFieldHeaderText'
import {type FormFieldValidationStatusProps} from './components/formField/FormFieldValidationStatus'
import {type FormInput as FormInputImplementation} from './components/FormInput'
import {type MemberItemProps} from './members/array/items/ArrayOfObjectsItem'
import {type MemberFieldProps} from './members/object/MemberField'
import {type ObjectInputMemberProps} from './members/object/ObjectInputMember'
import {type ArrayItemError, type FieldError} from './store/types/memberErrors'
import {type FormBuilderProps} from './studio/FormBuilder'
import {type ArrayInputFunctionsProps} from './types/_transitional'
import {type PortableTextInputProps} from './types/inputProps'
import {type ObjectItem} from './types/itemProps'

// Code-split facades for the form components that `sanity` exports. The form runtime is by far
// the largest part of the package, and nothing renders it before a document is opened, yet every
// studio downloads it up front when these components are statically reachable from the entry
// (with `autoUpdates: true` the entry graph is fetched through the import map, untouched by
// tree-shaking). Internal code keeps importing the implementations directly; only the public
// exports go through these wrappers, which keep the implementation's signature and load it on
// first render behind their own Suspense boundary.

const LazyFormField = lazy(() =>
  import('./components/formField/FormField').then((module) => ({default: module.FormField})),
)

/**
 * @hidden
 * @beta */
export function FormField(
  props: ComponentProps<typeof FormFieldImplementation>,
): React.JSX.Element {
  return (
    <Suspense fallback={null}>
      <LazyFormField {...props} />
    </Suspense>
  )
}

const LazyFormFieldHeaderText = lazy(() =>
  import('./components/formField/FormFieldHeaderText').then((module) => ({
    default: module.FormFieldHeaderText,
  })),
)

/**
 * @hidden
 * @beta */
export function FormFieldHeaderText(props: FormFieldHeaderTextProps): React.JSX.Element {
  return (
    <Suspense fallback={null}>
      <LazyFormFieldHeaderText {...props} />
    </Suspense>
  )
}

const LazyFormFieldValidationStatus = lazy(() =>
  import('./components/formField/FormFieldValidationStatus').then((module) => ({
    default: module.FormFieldValidationStatus,
  })),
)

/**
 * @hidden
 * @beta */
export function FormFieldValidationStatus(
  props: FormFieldValidationStatusProps,
): React.JSX.Element {
  return (
    <Suspense fallback={null}>
      <LazyFormFieldValidationStatus {...props} />
    </Suspense>
  )
}

const LazyFormInput = lazy(() =>
  import('./components/FormInput').then((module) => ({default: module.FormInput})),
)

/**
 * @hidden
 * @beta */
export function FormInput(
  props: ComponentProps<typeof FormInputImplementation>,
): React.JSX.Element {
  return (
    <Suspense fallback={null}>
      <LazyFormInput {...props} />
    </Suspense>
  )
}

const LazyArrayOfObjectsFunctions = lazy(() =>
  import('./inputs/arrays/ArrayOfObjectsInput/ArrayOfObjectsFunctions').then((module) => ({
    default: module.ArrayOfObjectsFunctions,
  })),
)

/**
 * @hidden
 * @beta */
export function ArrayOfObjectsFunctions<
  Item extends ObjectItem,
  TSchemaType extends ArraySchemaType,
>(props: ArrayInputFunctionsProps<Item, TSchemaType>): React.JSX.Element {
  // React.lazy cannot carry the implementation's type parameters; this facade keeps the generic
  // signature for callers and hands the props to the erased lazy component.
  const erasedProps = props as unknown as ArrayInputFunctionsProps<ObjectItem, ArraySchemaType>

  return (
    <Suspense fallback={null}>
      <LazyArrayOfObjectsFunctions {...erasedProps} />
    </Suspense>
  )
}

const LazyPortableTextInput = lazy(() =>
  import('./inputs/PortableText/PortableTextInput').then((module) => ({
    default: module.PortableTextInput,
  })),
)

/**
 * The default Portable Text input. Loads the editor on first render.
 *
 * @public
 */
export function PortableTextInput(props: PortableTextInputProps): React.JSX.Element {
  return (
    <Suspense fallback={null}>
      <LazyPortableTextInput {...props} />
    </Suspense>
  )
}

const LazyArrayOfObjectsItem = lazy(() =>
  import('./members/array/items/ArrayOfObjectsItem').then((module) => ({
    default: module.ArrayOfObjectsItem,
  })),
)

/**
 * @hidden
 * @beta */
export function ArrayOfObjectsItem(props: MemberItemProps): React.JSX.Element {
  return (
    <Suspense fallback={null}>
      <LazyArrayOfObjectsItem {...props} />
    </Suspense>
  )
}

const LazyMemberItemError = lazy(() =>
  import('./members/array/MemberItemError').then((module) => ({default: module.MemberItemError})),
)

/**
 * @hidden
 * @beta */
export function MemberItemError(props: {member: ArrayItemError}): React.JSX.Element {
  return (
    <Suspense fallback={null}>
      <LazyMemberItemError {...props} />
    </Suspense>
  )
}

const LazyMemberField = lazy(() =>
  import('./members/object/MemberField').then((module) => ({default: module.MemberField})),
)

/**
 * @hidden
 * @beta */
export function MemberField(props: MemberFieldProps): React.JSX.Element {
  return (
    <Suspense fallback={null}>
      <LazyMemberField {...props} />
    </Suspense>
  )
}

const LazyMemberFieldError = lazy(() =>
  import('./members/object/MemberFieldError').then((module) => ({
    default: module.MemberFieldError,
  })),
)

/**
 * @hidden
 * @beta */
export function MemberFieldError(props: {member: FieldError}): React.JSX.Element {
  return (
    <Suspense fallback={null}>
      <LazyMemberFieldError {...props} />
    </Suspense>
  )
}

const LazyObjectInputMember = lazy(() =>
  import('./members/object/ObjectInputMember').then((module) => ({
    default: module.ObjectInputMember,
  })),
)

/**
 * @public
 */
export function ObjectInputMember(props: ObjectInputMemberProps): React.JSX.Element {
  return (
    <Suspense fallback={null}>
      <LazyObjectInputMember {...props} />
    </Suspense>
  )
}

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
