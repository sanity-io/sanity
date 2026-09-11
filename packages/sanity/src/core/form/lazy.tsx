import {createLazyComponent} from '../components/lazy/createLazyComponent'
import {LoadingBlock} from '../components/loadingBlock/LoadingBlock'
import {type EditPortalProps} from './components/EditPortal'
import {type EnhancedObjectDialogProps} from './components/EnhancedObjectDialog'

// Code-split facades for the form components that `sanity` exports. The form runtime is by far
// the largest part of the package, and nothing renders it before a document is opened, yet every
// studio downloads it up front when these components are statically reachable from the entry
// (with `autoUpdates: true` the entry graph is fetched through the import map, untouched by
// tree-shaking). Internal code keeps importing the implementations directly; only the public
// exports go through these wrappers, which load the implementation on first render.

export const EditPortal = createLazyComponent<EditPortalProps>(() =>
  import('./components/EditPortal').then((module) => module.EditPortal),
)

export const EnhancedObjectDialog = createLazyComponent<EnhancedObjectDialogProps>(() =>
  import('./components/EnhancedObjectDialog').then((module) => module.EnhancedObjectDialog),
)

export const FormField = createLazyComponent(() =>
  import('./components/formField/FormField').then((module) => module.FormField),
)

export const FormFieldHeaderText = createLazyComponent(() =>
  import('./components/formField/FormFieldHeaderText').then((module) => module.FormFieldHeaderText),
)

export const FormFieldValidationStatus = createLazyComponent(() =>
  import('./components/formField/FormFieldValidationStatus').then(
    (module) => module.FormFieldValidationStatus,
  ),
)

export const FormInput = createLazyComponent(() =>
  import('./components/FormInput').then((module) => module.FormInput),
)

export const ArrayOfObjectsFunctions = createLazyComponent(() =>
  import('./inputs/arrays/ArrayOfObjectsInput/ArrayOfObjectsFunctions').then(
    (module) => module.ArrayOfObjectsFunctions,
  ),
)

export const ArrayOfObjectsInput = createLazyComponent(() =>
  import('./inputs/arrays/ArrayOfObjectsInput/ArrayOfObjectsInput').then(
    (module) => module.ArrayOfObjectsInput,
  ),
)

export const ArrayOfObjectOptionsInput = createLazyComponent(() =>
  import('./inputs/arrays/ArrayOfOptionsInput/ArrayOfObjectOptionsInput').then(
    (module) => module.ArrayOfObjectOptionsInput,
  ),
)

export const ArrayOfOptionsInput = createLazyComponent(() =>
  import('./inputs/arrays/ArrayOfOptionsInput/ArrayOfOptionsInput').then(
    (module) => module.ArrayOfOptionsInput,
  ),
)

export const ArrayOfPrimitiveOptionsInput = createLazyComponent(() =>
  import('./inputs/arrays/ArrayOfOptionsInput/ArrayOfPrimitiveOptionsInput').then(
    (module) => module.ArrayOfPrimitiveOptionsInput,
  ),
)

export const ArrayOfPrimitivesFunctions = createLazyComponent(() =>
  import('./inputs/arrays/ArrayOfPrimitivesInput/ArrayOfPrimitivesFunctions').then(
    (module) => module.ArrayOfPrimitivesFunctions,
  ),
)

export const ArrayOfPrimitivesInput = createLazyComponent(() =>
  import('./inputs/arrays/ArrayOfPrimitivesInput/ArrayOfPrimitivesInput').then(
    (module) => module.ArrayOfPrimitivesInput,
  ),
)

export const UniversalArrayInput = createLazyComponent(() =>
  import('./inputs/arrays/UniversalArrayInput').then((module) => module.UniversalArrayInput),
)

export const BooleanInput = createLazyComponent(() =>
  import('./inputs/BooleanInput').then((module) => module.BooleanInput),
)

export const DateInput = createLazyComponent(() =>
  import('./inputs/DateInputs/DateInput').then((module) => module.DateInput),
)

export const DateTimeInput = createLazyComponent(() =>
  import('./inputs/DateInputs/DateTimeInput').then((module) => module.DateTimeInput),
)

export const ObjectInput = createLazyComponent(() =>
  import('./inputs/ObjectInput/ObjectInput').then((module) => module.ObjectInput),
)

export const PortableTextInput = createLazyComponent(() =>
  import('./inputs/PortableText/PortableTextInput').then((module) => module.PortableTextInput),
)

export const SelectInput = createLazyComponent(() =>
  import('./inputs/SelectInput').then((module) => module.SelectInput),
)

export const SlugInput = createLazyComponent(() =>
  import('./inputs/Slug/SlugInput').then((module) => module.SlugInput),
)

export const StringInput = createLazyComponent(() =>
  import('./inputs/StringInput/StringInput').then((module) => module.StringInput),
)

export const TagsArrayInput = createLazyComponent(() =>
  import('./inputs/TagsArrayInput').then((module) => module.TagsArrayInput),
)

export const ArrayOfObjectsItem = createLazyComponent(() =>
  import('./members/array/items/ArrayOfObjectsItem').then((module) => module.ArrayOfObjectsItem),
)

export const ArrayOfPrimitivesItem = createLazyComponent(() =>
  import('./members/array/items/ArrayOfPrimitivesItem').then(
    (module) => module.ArrayOfPrimitivesItem,
  ),
)

export const MemberItemError = createLazyComponent(() =>
  import('./members/array/MemberItemError').then((module) => module.MemberItemError),
)

export const MemberField = createLazyComponent(() =>
  import('./members/object/MemberField').then((module) => module.MemberField),
)

export const MemberFieldError = createLazyComponent(() =>
  import('./members/object/MemberFieldError').then((module) => module.MemberFieldError),
)

export const ObjectInputMember = createLazyComponent(() =>
  import('./members/object/ObjectInputMember').then((module) => module.ObjectInputMember),
)

export const FormBuilder = createLazyComponent(
  () => import('./studio/FormBuilder').then((module) => module.FormBuilder),
  <LoadingBlock />,
)

export const FormProvider = createLazyComponent(() =>
  import('./studio/FormProvider').then((module) => module.FormProvider),
)

export const StudioCrossDatasetReferenceInput = createLazyComponent(() =>
  import('./studio/inputs/crossDatasetReference/StudioCrossDatasetReferenceInput').then(
    (module) => module.StudioCrossDatasetReferenceInput,
  ),
)

export const StudioReferenceInput = createLazyComponent(() =>
  import('./studio/inputs/reference/StudioReferenceInput').then(
    (module) => module.StudioReferenceInput,
  ),
)

export const StudioFileInput = createLazyComponent(() =>
  import('./studio/inputs/StudioFileInput').then((module) => module.StudioFileInput),
)

export const StudioImageInput = createLazyComponent(() =>
  import('./studio/inputs/StudioImageInput').then((module) => module.StudioImageInput),
)
