import {type ComponentProps} from 'react'

import {createLazyComponent} from '../components/lazy/createLazyComponent'
import {LoadingBlock} from '../components/loadingBlock/LoadingBlock'
import {type FormField as FormFieldImplementation} from './components/formField/FormField'
import {type FormInput as FormInputImplementation} from './components/FormInput'
import {type MemberFieldProps} from './members/object/MemberField'
import {type MemberFieldSet as MemberFieldSetImplementation} from './members/object/MemberFieldset'
import {type ObjectInputMemberProps} from './members/object/ObjectInputMember'
import {type ObjectMembersProps} from './members/object/ObjectInputMembers'
import {type FieldError} from './store/types/memberErrors'
import {type FormBuilderProps} from './studio/FormBuilder'
import {type FormProviderProps} from './studio/FormProvider'

// Code-split facades for the form components that only the internals entries export (the ones the
// root `sanity` entry exports are in `./publicLazy`, so this module stays out of a studio's first
// load). The form runtime is by far
// the largest part of the package, and nothing renders it before a document is opened, yet every
// studio downloads it up front when these components are statically reachable from the entry
// (with `autoUpdates: true` the entry graph is fetched through the import map, untouched by
// tree-shaking). Internal code imports the implementations directly — including structure, whose
// document form renders `FormBuilder` from `./studio/FormBuilder`, so opening a document does not
// wait for a chunk the entry already pulled before this change. All facades load the same
// `./publicComponents.lazy` chunk (see the comment there for why it is one chunk).
//
// Only `FormBuilder` and `PortableTextInput` (in `./publicLazy`) carry a fallback. They are the two that can be the
// first thing to render in their subtree, and `FormBuilder` is where a form's loading state
// belongs. The in-form facades deliberately have no boundary of their own: a boundary here would
// catch a suspending descendant (lazy form middleware, a lazy custom input) and unmount the
// subtree around it, wiping local state, and there is no sensible field-sized fallback. They
// suspend to `FormBuilder`'s boundary, or to the Portable Text per-block one, which is where form
// nodes are meant to suspend.
//
// Four components that `sanity` exports are *not* facaded, because the marginal gzip each keeps
// off the entry's static closure does not pay for a suspension: `FormFieldValidationStatus`
// (0.1 kB — its implementation is on the boot path anyway), `FormFieldHeaderText` (1.6 kB),
// `MemberItemError` (2.5 kB) and `ArrayOfObjectsFunctions` (8.1 kB, and facading it erased its
// generic signature). They are exported straight from their implementation modules.

/**
 * @hidden
 * @internal
 */
export const FormField = createLazyComponent<ComponentProps<typeof FormFieldImplementation>>(() =>
  import('./publicComponents.lazy').then((module) => ({default: module.FormField})),
)

/**
 * @hidden
 * @internal
 */
export const FormInput = createLazyComponent<ComponentProps<typeof FormInputImplementation>>(() =>
  import('./publicComponents.lazy').then((module) => ({default: module.FormInput})),
)
/**
 * @hidden
 * @internal
 */
export const MemberField = createLazyComponent<MemberFieldProps>(() =>
  import('./publicComponents.lazy').then((module) => ({default: module.MemberField})),
)

/**
 * @hidden
 * @internal
 */
export const MemberFieldError = createLazyComponent<{member: FieldError}>(() =>
  import('./publicComponents.lazy').then((module) => ({default: module.MemberFieldError})),
)

/**
 * @internal
 */
export const ObjectInputMember = createLazyComponent<ObjectInputMemberProps>(() =>
  import('./publicComponents.lazy').then((module) => ({default: module.ObjectInputMember})),
)

/**
 * @internal
 */
export const FormBuilder = createLazyComponent<FormBuilderProps>(
  () => import('./publicComponents.lazy').then((module) => ({default: module.FormBuilder})),
  {fallback: <LoadingBlock />},
)

/**
 * Like the form components it resolves, it has no Suspense boundary of its own: a consumer that
 * renders it outside `FormBuilder` wraps it in `<Suspense>`.
 *
 * @internal This API might change.
 */
export const FormProvider = createLazyComponent<FormProviderProps>(() =>
  import('./publicComponents.lazy').then((module) => ({default: module.FormProvider})),
)
/**
 * Convenience component for wrapping an object input
 * @internal
 */
export const ObjectInputMembers = createLazyComponent<ObjectMembersProps>(() =>
  import('./publicComponents.lazy').then((module) => ({default: module.ObjectInputMembers})),
)

/**
 * @deprecated Use ObjectInputMembers instead
 * @internal
 */
export const ObjectMembers = ObjectInputMembers

/** @internal */
export const MemberFieldSet = createLazyComponent<
  ComponentProps<typeof MemberFieldSetImplementation>
>(() => import('./publicComponents.lazy').then((module) => ({default: module.MemberFieldSet})))
