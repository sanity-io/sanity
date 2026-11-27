import {createLazyComponent} from '../components/lazy/createLazyComponent'
import {LoadingBlock} from '../components/loadingBlock/LoadingBlock'
import {type DialogProps, type PopoverProps} from './components/EditPortal'
import {type EnhancedObjectDialogProps} from './components/EnhancedObjectDialog'
import {type DateInputProps} from './inputs/DateInputs/DateInput'
import {type DateTimeInputProps} from './inputs/DateInputs/DateTimeInput'
import {type SlugInputProps} from './inputs/Slug/SlugInput'
import {type TagsArrayInputProps} from './inputs/TagsArrayInput'
import {type MemberItemProps} from './members/array/items/ArrayOfObjectsItem'
import {type PrimitiveMemberItemProps} from './members/array/items/ArrayOfPrimitivesItem'
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

// Code-split facades for the form components that the root `sanity` entry exports. They live apart
// from the internal facades in `./lazy`, which only the internals entries export: whatever this
// module holds is part of every studio's first load, so keep it to the public components. The
// implementations load from the same `./publicComponents.lazy` chunk as the internal facades.

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
 * @beta
 * Creates a dialog or a popover for editing content.
 * Handles presence and virtual scrolling.
 */
export const EditPortal = createLazyComponent<PopoverProps | DialogProps>(() =>
  import('./publicComponents.lazy').then((module) => ({default: module.EditPortal})),
)

/**
 * Array of predefined object options input
 * Note: this input can handle only object values
 * @hidden
 * @beta
 */
export const ArrayOfObjectOptionsInput = createLazyComponent<ArrayOfObjectsInputProps>(() =>
  import('./publicComponents.lazy').then((module) => ({default: module.ArrayOfObjectOptionsInput})),
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
export const ArrayOfOptionsInput = createLazyComponent<
  ArrayOfObjectsInputProps | ArrayOfPrimitivesInputProps
>(() => import('./publicComponents.lazy').then((module) => ({default: module.ArrayOfOptionsInput})))

/**
 * Array of predefined primitive options input
 * Note: this input can only handle primitive values
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
export const ArrayOfPrimitivesInput = createLazyComponent<ArrayOfPrimitivesInputProps>(() =>
  import('./publicComponents.lazy').then((module) => ({default: module.ArrayOfPrimitivesInput})),
)

/**
 * @hidden
 * @beta
 */
export const ArrayOfPrimitivesItem = createLazyComponent<PrimitiveMemberItemProps>(() =>
  import('./publicComponents.lazy').then((module) => ({default: module.ArrayOfPrimitivesItem})),
)

/**
 * The default input component for cross-dataset reference fields, for wrapping or rendering in a
 * custom input.
 *
 * @hidden
 * @public
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
export const ObjectInput = createLazyComponent<ObjectInputProps>(() =>
  import('./publicComponents.lazy').then((module) => ({default: module.ObjectInput})),
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
export const SlugInput = createLazyComponent<SlugInputProps>(() =>
  import('./publicComponents.lazy').then((module) => ({default: module.SlugInput})),
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
export const TagsArrayInput = createLazyComponent<TagsArrayInputProps>(() =>
  import('./publicComponents.lazy').then((module) => ({default: module.TagsArrayInput})),
)

/**
 * Universal array input that will introspect its schemaType and delegate to the right implementation
 * Useful as a fallback/last resort input for an array type
 * @hidden
 * @beta
 */
export const UniversalArrayInput = createLazyComponent<
  ArrayOfObjectsInputProps | ArrayOfPrimitivesInputProps
>(() => import('./publicComponents.lazy').then((module) => ({default: module.UniversalArrayInput})))
