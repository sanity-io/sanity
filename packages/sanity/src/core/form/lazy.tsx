import {type ComponentProps} from 'react'

import {createLazyComponent} from '../components/lazy/createLazyComponent'
import {LoadingBlock} from '../components/loadingBlock/LoadingBlock'
import {type FormField as FormFieldImplementation} from './components/formField/FormField'
import {type FormInput as FormInputImplementation} from './components/FormInput'
import {type MemberItemProps} from './members/array/items/ArrayOfObjectsItem'
import {type MemberFieldProps} from './members/object/MemberField'
import {type ObjectInputMemberProps} from './members/object/ObjectInputMember'
import {type FieldError} from './store/types/memberErrors'
import {type FormBuilderProps} from './studio/FormBuilder'
import {type PortableTextInputProps} from './types/inputProps'

// Code-split facades for the form components that `sanity` exports. The form runtime is by far
// the largest part of the package, and nothing renders it before a document is opened, yet every
// studio downloads it up front when these components are statically reachable from the entry
// (with `autoUpdates: true` the entry graph is fetched through the import map, untouched by
// tree-shaking). Internal code imports the implementations directly — including structure, whose
// document form renders `FormBuilder` from `./studio/FormBuilder`, so opening a document does not
// wait for a chunk the entry already pulled before this change.
//
// Only `FormBuilder` and `PortableTextInput` carry a fallback. They are the two that can be the
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
 * @beta */
export const FormField = createLazyComponent<ComponentProps<typeof FormFieldImplementation>>(
  () => import('./components/formField/FormField.lazy'),
)

/**
 * @hidden
 * @beta */
export const FormInput = createLazyComponent<ComponentProps<typeof FormInputImplementation>>(
  () => import('./components/FormInput.lazy'),
)

/**
 * The default Portable Text input. Loads the editor on first render.
 *
 * @public
 */
export const PortableTextInput = createLazyComponent<PortableTextInputProps>(
  () => import('./inputs/PortableText/PortableTextInput.lazy'),
  {fallback: <LoadingBlock />},
)

/**
 * @hidden
 * @beta */
export const ArrayOfObjectsItem = createLazyComponent<MemberItemProps>(
  () => import('./members/array/items/ArrayOfObjectsItem.lazy'),
)

/**
 * @hidden
 * @beta */
export const MemberField = createLazyComponent<MemberFieldProps>(
  () => import('./members/object/MemberField.lazy'),
)

/**
 * @hidden
 * @beta */
export const MemberFieldError = createLazyComponent<{member: FieldError}>(
  () => import('./members/object/MemberFieldError.lazy'),
)

/**
 * @public
 */
export const ObjectInputMember = createLazyComponent<ObjectInputMemberProps>(
  () => import('./members/object/ObjectInputMember.lazy'),
)

/**
 * @alpha
 */
export const FormBuilder = createLazyComponent<FormBuilderProps>(
  () => import('./studio/FormBuilder.lazy'),
  {fallback: <LoadingBlock />},
)
