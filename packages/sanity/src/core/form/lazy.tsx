import {type ComponentProps} from 'react'

import {createLazyComponent} from '../components/lazy/createLazyComponent'
import {LoadingBlock} from '../components/loadingBlock/LoadingBlock'
import {type EnhancedObjectDialogProps} from './components/EnhancedObjectDialog'
import {type FormField as FormFieldImplementation} from './components/formField/FormField'
import {type FormInput as FormInputImplementation} from './components/FormInput'
import {type DateInputProps} from './inputs/DateInputs/DateInput'
import {type DateTimeInputProps} from './inputs/DateInputs/DateTimeInput'
import {type SlugInputProps} from './inputs/Slug/SlugInput'
import {type TagsArrayInputProps} from './inputs/TagsArrayInput'
import {type MemberItemProps} from './members/array/items/ArrayOfObjectsItem'
import {type PrimitiveMemberItemProps} from './members/array/items/ArrayOfPrimitivesItem'
import {type MemberFieldProps} from './members/object/MemberField'
import {type MemberFieldSet as MemberFieldSetImplementation} from './members/object/MemberFieldset'
import {type ObjectInputMemberProps} from './members/object/ObjectInputMember'
import {type ObjectMembersProps} from './members/object/ObjectInputMembers'
import {type FieldError} from './store/types/memberErrors'
import {type FormBuilderProps} from './studio/FormBuilder'
import {type FormProviderProps} from './studio/FormProvider'
import {type StudioCrossDatasetReferenceInputProps} from './studio/inputs/crossDatasetReference/StudioCrossDatasetReferenceInput'
import {type StudioReferenceInputProps} from './studio/inputs/reference/StudioReferenceInput'
import {type FileInputProps} from './studio/inputs/StudioFileInput'
import {type ImageInputProps} from './studio/inputs/StudioImageInput'
import {
  type ArrayOfObjectsInputProps,
  type ArrayOfPrimitivesInputProps,
  type ObjectInputProps,
  type PortableTextInputProps,
  type StringInputProps,
} from './types/inputProps'

// Code-split facades for the form components that `sanity` exports. The form runtime is by far
// the largest part of the package, and nothing renders it before a document is opened, yet every
// studio downloads it up front when these components are statically reachable from the entry
// (with `autoUpdates: true` the entry graph is fetched through the import map, untouched by
// tree-shaking). Internal code imports the implementations directly — including structure, whose
// document form renders `FormBuilder` from `./studio/FormBuilder`, so opening a document does not
// wait for a chunk the entry already pulled before this change. All facades load the same
// `./publicComponents.lazy` chunk (see the comment there for why it is one chunk).
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
 * @beta
 */
export const FormField = createLazyComponent<ComponentProps<typeof FormFieldImplementation>>(() =>
  import('./publicComponents.lazy').then((module) => ({default: module.FormField})),
)

/**
 * @hidden
 * @beta
 */
export const FormInput = createLazyComponent<ComponentProps<typeof FormInputImplementation>>(() =>
  import('./publicComponents.lazy').then((module) => ({default: module.FormInput})),
)

/**
 * The default Portable Text input. Loads the editor on first render.
 *
 * @public
 */
export const PortableTextInput = createLazyComponent<PortableTextInputProps>(
  () => import('./publicComponents.lazy').then((module) => ({default: module.PortableTextInput})),
  {fallback: <LoadingBlock />},
)

/**
 * @hidden
 * @beta
 */
export const ArrayOfObjectsItem = createLazyComponent<MemberItemProps>(() =>
  import('./publicComponents.lazy').then((module) => ({default: module.ArrayOfObjectsItem})),
)

/**
 * @hidden
 * @beta
 */
export const MemberField = createLazyComponent<MemberFieldProps>(() =>
  import('./publicComponents.lazy').then((module) => ({default: module.MemberField})),
)

/**
 * @hidden
 * @beta
 */
export const MemberFieldError = createLazyComponent<{member: FieldError}>(() =>
  import('./publicComponents.lazy').then((module) => ({default: module.MemberFieldError})),
)

/**
 * @public
 */
export const ObjectInputMember = createLazyComponent<ObjectInputMemberProps>(() =>
  import('./publicComponents.lazy').then((module) => ({default: module.ObjectInputMember})),
)

/**
 * @alpha
 */
export const FormBuilder = createLazyComponent<FormBuilderProps>(
  () => import('./publicComponents.lazy').then((module) => ({default: module.FormBuilder})),
  {fallback: <LoadingBlock />},
)

/**
 * Like the form components it resolves, it has no Suspense boundary of its own: a consumer that
 * renders it outside `FormBuilder` wraps it in `<Suspense>`.
 *
 * @alpha This API might change.
 */
export const FormProvider = createLazyComponent<FormProviderProps>(() =>
  import('./publicComponents.lazy').then((module) => ({default: module.FormProvider})),
)

/**
 * @hidden
 * @beta
 */
export const StringInput = createLazyComponent<StringInputProps>(() =>
  import('./publicComponents.lazy').then((module) => ({default: module.StringInput})),
)

/**
 * @hidden
 * @beta
 */
export const DateInput = createLazyComponent<DateInputProps>(() =>
  import('./publicComponents.lazy').then((module) => ({default: module.DateInput})),
)

/**
 * @hidden
 * @beta
 */
export const DateTimeInput = createLazyComponent<DateTimeInputProps>(() =>
  import('./publicComponents.lazy').then((module) => ({default: module.DateTimeInput})),
)

/**
 * @hidden
 * @beta
 */
export const SlugInput = createLazyComponent<SlugInputProps>(() =>
  import('./publicComponents.lazy').then((module) => ({default: module.SlugInput})),
)

/**
 * @hidden
 * @beta
 */
export const TagsArrayInput = createLazyComponent<TagsArrayInputProps>(() =>
  import('./publicComponents.lazy').then((module) => ({default: module.TagsArrayInput})),
)

/**
 * @hidden
 * @beta
 */
export const ObjectInput = createLazyComponent<ObjectInputProps>(() =>
  import('./publicComponents.lazy').then((module) => ({default: module.ObjectInput})),
)

/**
 * Universal array input that will introspect its schemaType and delegate to the right implementation
 * Useful as a fallback/last resort input for an array type
 *
 * @hidden
 * @beta
 */
export const UniversalArrayInput = createLazyComponent<
  ArrayOfObjectsInputProps | ArrayOfPrimitivesInputProps
>(() => import('./publicComponents.lazy').then((module) => ({default: module.UniversalArrayInput})))

/**
 * @hidden
 * @beta
 */
export const ArrayOfObjectsInput = createLazyComponent<ArrayOfObjectsInputProps>(() =>
  import('./publicComponents.lazy').then((module) => ({default: module.ArrayOfObjectsInput})),
)

/**
 * @hidden
 * @beta
 */
export const ArrayOfPrimitivesInput = createLazyComponent<ArrayOfPrimitivesInputProps>(() =>
  import('./publicComponents.lazy').then((module) => ({default: module.ArrayOfPrimitivesInput})),
)

/**
 * @hidden
 * @beta
 */
export const ArrayOfOptionsInput = createLazyComponent<
  ArrayOfObjectsInputProps | ArrayOfPrimitivesInputProps
>(() => import('./publicComponents.lazy').then((module) => ({default: module.ArrayOfOptionsInput})))

/**
 * Array of predefined object options input
 * Note: this input can handle only object values
 *
 * @hidden
 * @beta
 */
export const ArrayOfObjectOptionsInput = createLazyComponent<ArrayOfObjectsInputProps>(() =>
  import('./publicComponents.lazy').then((module) => ({default: module.ArrayOfObjectOptionsInput})),
)

/**
 * Array of predefined primitive options input
 * Note: this input can only handle primitive values
 *
 * @hidden
 * @beta
 */
export const ArrayOfPrimitiveOptionsInput = createLazyComponent<ArrayOfPrimitivesInputProps>(() =>
  import('./publicComponents.lazy').then((module) => ({
    default: module.ArrayOfPrimitiveOptionsInput,
  })),
)

/**
 * @hidden
 * @beta
 */
export const ArrayOfPrimitivesItem = createLazyComponent<PrimitiveMemberItemProps>(() =>
  import('./publicComponents.lazy').then((module) => ({default: module.ArrayOfPrimitivesItem})),
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

/**
 * Creates a dialog or a popover for editing content.
 * Handles presence and virtual scrolling.
 *
 * When multiple dialogs are open, only the top-most dialog is visible.
 * Non-top dialogs are hidden via CSS while preserving their state.
 *
 * @beta
 */
export const EnhancedObjectDialog = createLazyComponent<EnhancedObjectDialogProps>(() =>
  import('./publicComponents.lazy').then((module) => ({default: module.EnhancedObjectDialog})),
)

/**
 * @hidden
 * @beta
 */
export const ReferenceInput = createLazyComponent<StudioReferenceInputProps>(() =>
  import('./publicComponents.lazy').then((module) => ({default: module.StudioReferenceInput})),
)

/**
 * @hidden
 * @beta
 */
export const CrossDatasetReferenceInput =
  createLazyComponent<StudioCrossDatasetReferenceInputProps>(() =>
    import('./publicComponents.lazy').then((module) => ({
      default: module.StudioCrossDatasetReferenceInput,
    })),
  )

/**
 * @hidden
 * @beta
 */
export const FileInput = createLazyComponent<FileInputProps>(() =>
  import('./publicComponents.lazy').then((module) => ({default: module.StudioFileInput})),
)

/**
 * @hidden
 * @beta
 */
export const ImageInput = createLazyComponent<ImageInputProps>(() =>
  import('./publicComponents.lazy').then((module) => ({default: module.StudioImageInput})),
)
