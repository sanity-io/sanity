/**
 * Unstable export surface for embedding Studio functionality in an app outside the Studio —
 * form rendering (`FormBuilder` and friends) plus the supporting providers and utilities it
 * needs (workspace, source, locale, presence, etc.) — without pulling in the full `sanity` root
 * entry (and the stylesheets it side-effect imports). Like other underscore-prefixed entries this
 * is not considered part of the public API — exports may be added, changed or removed in any
 * release without notice.
 */
import '@sanity/ui/styles.css'
// oxlint-disable-next-line import/no-unassigned-import -- side effect: keeps the module augmentations declared by this module on the public type surface
import '../core/form/types/definitionExtensions'

export {ChangeIndicatorsTracker} from '../core/changeIndicators/tracker'
export {ScrollContainer} from '../core/components/scroll/scrollContainer'
export {type Source, type SourceClientOptions, type Workspace} from '../core/config/types'
export {pathToString} from '../core/field/paths/helpers'
export {FormFieldHeaderText} from '../core/form/components/formField/FormFieldHeaderText'
export {FormInput} from '../core/form/components/FormInput'
export {DivergencesProvider} from '../core/form/contexts/DivergencesProvider'
export {VirtualizerScrollInstanceProvider} from '../core/form/inputs/arrays/ArrayOfObjectsInput/List/VirtualizerScrollInstanceProvider'
export {set, setIfMissing, unset} from '../core/form/patch/patch'
export {createPatchChannel} from '../core/form/patch/PatchChannel'
export {PatchEvent} from '../core/form/patch/PatchEvent'
export {
  type FormPatch,
  type FormPatchJSONValue,
  type FormSetIfMissingPatch,
  type FormUnsetPatch,
  type PatchArg,
} from '../core/form/patch/types'
export {setAtPath} from '../core/form/store/stateTreeHelper'
export {type FieldMember, type ObjectMember} from '../core/form/store/types/members'
export {type BaseFormNode, type ObjectArrayFormNode} from '../core/form/store/types/nodes'
export {type StateTree} from '../core/form/store/types/state'
export {useFormState} from '../core/form/store/useFormState'
export {getExpandOperations} from '../core/form/store/utils/getExpandOperations'
export {FormBuilder} from '../core/form/studio/FormBuilder'
export {type FieldProps, type ObjectFieldProps} from '../core/form/types/fieldProps'
export {type FormDocumentValue} from '../core/form/types/formDocumentValue'
export {
  type InputProps,
  type ObjectInputProps,
  type StringInputProps,
} from '../core/form/types/inputProps'
export {type ItemProps} from '../core/form/types/itemProps'
export {TransformPatches} from '../core/form/utils/TransformPatches'
export {useDateTimeFormat} from '../core/hooks/useDateTimeFormat'
export {useRelativeTime} from '../core/hooks/useRelativeTime'
export {useSchema} from '../core/hooks/useSchema'
export {type StudioLocaleResourceKeys} from '../core/i18n/bundles/studio'
export {LocaleProvider} from '../core/i18n/components/LocaleProvider'
export {useCurrentLocale} from '../core/i18n/hooks/useLocale'
export {useTranslation} from '../core/i18n/hooks/useTranslation'
export {defaultLocale} from '../core/i18n/locales'
export {Translate} from '../core/i18n/Translate'
export {type LocaleResourceBundle, type LocaleSource} from '../core/i18n/types'
export {PerspectiveProvider} from '../core/perspective/PerspectiveProvider'
export {FieldPresence} from '../core/presence/FieldPresence'
export {PresenceOverlay} from '../core/presence/overlay/PresenceOverlay'
export {type FormNodePresence} from '../core/presence/types'
export {type PreparedSnapshot} from '../core/preview/types'
export {type ProjectData} from '../core/store/project/types'
export {ResourceCacheProvider} from '../core/store/ResourceCacheProvider'
export {CopyPasteProvider} from '../core/studio/copyPaste/CopyPasteProvider'
export {SourceProvider} from '../core/studio/source'
export {useWorkspace, WorkspaceProvider} from '../core/studio/workspace'
export {EMPTY_ARRAY} from '../core/util/empty'
export {validateDocument} from '../core/validation'
export {type FIXME} from '../core/FIXME'
export {
  defineArrayMember,
  defineField,
  defineType,
  isObjectSchemaType,
  type ArrayDefinition,
  type FieldDefinition,
  type Mutation,
  type ObjectDefinition,
  type ObjectField,
  type ObjectSchemaType,
  type Path,
  type ValidationMarker,
} from '@sanity/types'
