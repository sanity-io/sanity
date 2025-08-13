import {CorsOriginError, type ReleaseDocument, type SanityClient} from '@sanity/client'
import {
  type ArraySchemaType,
  type Asset,
  type BlockDefinition,
  type BooleanSchemaType,
  type CrossDatasetReferenceSchemaType,
  defineArrayMember,
  defineField,
  defineType,
  type FileSchemaType,
  type FormNodeValidation,
  type GlobalDocumentReferenceSchemaType,
  type I18nTextRecord,
  isArrayOfBlocksSchemaType,
  isArrayOfObjectsSchemaType,
  isArrayOfPrimitivesSchemaType,
  isArraySchemaType,
  isBlockChildrenObjectField,
  isBlockListObjectField,
  isBlockSchemaType,
  isBlockStyleObjectField,
  isBooleanSchemaType,
  isCreateIfNotExistsMutation,
  isCreateMutation,
  isCreateOrReplaceMutation,
  isCreateSquashedMutation,
  isCrossDatasetReference,
  isCrossDatasetReferenceSchemaType,
  isDeleteMutation,
  isDeprecatedSchemaType,
  isDeprecationConfiguration,
  isDocumentSchemaType,
  isFileSchemaType,
  isGlobalDocumentReference,
  isImage,
  isImageSchemaType,
  isIndexSegment,
  isIndexTuple,
  isKeyedObject,
  isKeySegment,
  isNumberSchemaType,
  isObjectSchemaType,
  isPatchMutation,
  isPortableTextListBlock,
  isPortableTextSpan,
  isPortableTextTextBlock,
  isPrimitiveSchemaType,
  isReference,
  isReferenceSchemaType,
  isSanityDocument,
  isSearchStrategy,
  isSlug,
  isSpanSchemaType,
  isStringSchemaType,
  isTitledListValue,
  isTypedObject,
  isValidationError,
  isValidationErrorMarker,
  isValidationInfo,
  isValidationInfoMarker,
  isValidationWarning,
  isValidationWarningMarker,
  type MultiFieldSet,
  type NumberSchemaType,
  type ObjectField,
  type ObjectSchemaType,
  type Path,
  type PreviewValue,
  type ReferenceSchemaType,
  type Role,
  type Rule,
  type RuleSpec,
  type SanityDocument,
  type SanityDocumentLike,
  type Schema,
  type SchemaType,
  type SchemaValidationValue,
  searchStrategies,
  type SearchStrategy,
  type SpanSchemaType,
  type StringSchemaType,
  typed,
} from '@sanity/types'
import {isEmptyObject} from '@sanity/util/content'
import {findIndex, noop} from 'rxjs'

import {useCanvasCompanionDoc} from '../core/canvas/actions/useCanvasCompanionDoc'
import {useNavigateToCanvasDoc} from '../core/canvas/useNavigateToCanvasDoc'
import {ChangeFieldWrapper} from '../core/changeIndicators/ChangeFieldWrapper'
import {ChangeIndicator} from '../core/changeIndicators/ChangeIndicator'
import {ChangeConnectorRoot} from '../core/changeIndicators/overlay/ChangeConnectorRoot'
import {
  ChangeIndicatorsTracker,
  useChangeIndicatorsReportedValues,
  useChangeIndicatorsReporter,
} from '../core/changeIndicators/tracker'
import {CommentDeleteDialog} from '../core/comments/components/CommentDeleteDialog'
import {CommentDisabledIcon} from '../core/comments/components/icons/CommentDisabledIcon'
import {CommentsList} from '../core/comments/components/list/CommentsList'
import {CommentInput} from '../core/comments/components/pte/comment-input/CommentInput'
import {CommentInlineHighlightSpan} from '../core/comments/components/pte/CommentInlineHighlightSpan'
import {COMMENTS_INSPECTOR_NAME} from '../core/comments/constants'
import {CommentsAuthoringPathProvider} from '../core/comments/context/authoring-path/CommentsAuthoringPathProvider'
import {CommentsProvider} from '../core/comments/context/comments/CommentsProvider'
import {CommentsEnabledProvider} from '../core/comments/context/enabled/CommentsEnabledProvider'
import {CommentsIntentProvider} from '../core/comments/context/intent/CommentsIntentProvider'
import {CommentsSelectedPathProvider} from '../core/comments/context/selected-path/CommentsSelectedPathProvider'
import {hasCommentMessageValue, isTextSelectionComment} from '../core/comments/helpers'
import {useComments} from '../core/comments/hooks/useComments'
import {useCommentsEnabled} from '../core/comments/hooks/useCommentsEnabled'
import {useCommentsSelectedPath} from '../core/comments/hooks/useCommentsSelectedPath'
import {useCommentsTelemetry} from '../core/comments/hooks/useCommentsTelemetry'
import {type CommentIntentGetter} from '../core/comments/types'
import {buildCommentRangeDecorations} from '../core/comments/utils/inline-comments/buildCommentRangeDecorations'
import {buildRangeDecorationSelectionsFromComments} from '../core/comments/utils/inline-comments/buildRangeDecorationSelectionsFromComments'
import {buildTextSelectionFromFragment} from '../core/comments/utils/inline-comments/buildTextSelectionFromFragment'
import {BetaBadge} from '../core/components/BetaBadge'
import {CapabilityGate} from '../core/components/CapabilityGate'
import {AutoCollapseMenu, CollapseMenu} from '../core/components/collapseMenu/CollapseMenu'
import {CollapseMenuButton} from '../core/components/collapseMenu/CollapseMenuButton'
import {CommandList} from '../core/components/commandList/CommandList'
import {
  type CommandListItemContext,
  type CommandListRenderItemCallback,
} from '../core/components/commandList/types'
import {ContextMenuButton} from '../core/components/contextMenuButton/ContextMenuButton'
import {DocumentStatus} from '../core/components/documentStatus/DocumentStatus'
import {DocumentStatusIndicator} from '../core/components/documentStatusIndicator/DocumentStatusIndicator'
import {ErrorActions} from '../core/components/errorActions/ErrorActions'
import {
  serializeError,
  useCopyErrorDetails,
} from '../core/components/errorActions/useCopyErrorDetails'
import {GetHookCollectionState} from '../core/components/hookCollection/GetHookCollectionState'
import {Hotkeys} from '../core/components/Hotkeys'
import {InsufficientPermissionsMessage} from '../core/components/InsufficientPermissionsMessage'
import {IntentButton} from '../core/components/IntentButton'
import {LoadingBlock} from '../core/components/loadingBlock/LoadingBlock'
import {PopoverDialog} from '../core/components/popoverDialog/PopoverDialog'
import {
  PreviewCard,
  ReferenceInputPreviewCard,
  usePreviewCard,
} from '../core/components/previewCard/PreviewCard'
import {CompactPreview} from '../core/components/previews/general/CompactPreview'
import {DefaultPreview} from '../core/components/previews/general/DefaultPreview'
import {DetailPreview} from '../core/components/previews/general/DetailPreview'
import {MediaPreview} from '../core/components/previews/general/MediaPreview'
import {BlockImagePreview} from '../core/components/previews/portableText/BlockImagePreview'
import {BlockPreview} from '../core/components/previews/portableText/BlockPreview'
import {InlinePreview} from '../core/components/previews/portableText/InlinePreview'
import {TemplatePreview} from '../core/components/previews/template/TemplatePreview'
import {
  type GeneralDocumentListLayoutKey,
  type GeneralPreviewLayoutKey,
  type PreviewLayoutKey,
} from '../core/components/previews/types'
import {CircularProgress} from '../core/components/progress/CircularProgress'
import {LinearProgress} from '../core/components/progress/LinearProgress'
import {
  useTrackerStore,
  useTrackerStoreReporter,
} from '../core/components/react-track-elements/hooks'
import {RelativeTime} from '../core/components/RelativeTime'
import {Resizable} from '../core/components/resizer/Resizable'
import {useRovingFocus} from '../core/components/rovingFocus/useRovingFocus'
import {useOnScroll} from '../core/components/scroll/hooks'
import {ScrollContainer} from '../core/components/scroll/scrollContainer'
import {StatusButton} from '../core/components/StatusButton'
import {TextWithTone} from '../core/components/textWithTone/TextWithTone'
import {TooltipOfDisabled} from '../core/components/TooltipOfDisabled'
import {ImperativeToast} from '../core/components/transitional/ImperativeToast'
import {LegacyLayerProvider} from '../core/components/transitional/LegacyLayerProvider'
import {AvatarSkeleton, UserAvatar} from '../core/components/userAvatar/UserAvatar'
import {WithReferringDocuments} from '../core/components/WithReferringDocuments'
import {useZIndex} from '../core/components/zOffsets/useZIndex'
import {ZIndexProvider} from '../core/components/zOffsets/ZIndexProvider'
import {useMiddlewareComponents} from '../core/config/components/useMiddlewareComponents'
import {ConfigPropertyError} from '../core/config/ConfigPropertyError'
import {ConfigResolutionError} from '../core/config/ConfigResolutionError'
import {createDefaultIcon} from '../core/config/createDefaultIcon'
import {createConfig, defineConfig} from '../core/config/defineConfig'
import {createPlugin, definePlugin} from '../core/config/definePlugin'
import {
  type DocumentActionComponent,
  type DocumentActionConfirmDialogProps,
  type DocumentActionDescription,
  type DocumentActionDialogProps,
  type DocumentActionGroup,
  type DocumentActionModalDialogProps,
  type DocumentActionPopoverDialogProps,
  type DocumentActionProps,
  type DuplicateDocumentActionComponent,
  isSanityDefinedAction,
} from '../core/config/document/actions'
import {
  type DocumentBadgeComponent,
  type DocumentBadgeDescription,
  type DocumentBadgeProps,
} from '../core/config/document/badges'
import {initialDocumentFieldActions} from '../core/config/document/fieldActions'
import {defineDocumentFieldAction} from '../core/config/document/fieldActions/define'
import {documentFieldActionsReducer} from '../core/config/document/fieldActions/reducer'
import {
  type DocumentFieldAction,
  type DocumentFieldActionGroup,
  type DocumentFieldActionItem,
  type DocumentFieldActionNode,
  type DocumentFieldActionProps,
} from '../core/config/document/fieldActions/types'
import {
  defineDocumentInspector,
  type DocumentInspector,
  type DocumentInspectorMenuItem,
  type DocumentInspectorProps,
  type DocumentInspectorUseMenuItemProps,
} from '../core/config/document/inspector'
import {flattenConfig} from '../core/config/flattenConfig'
import {prepareConfig} from '../core/config/prepareConfig'
import {
  createSourceFromConfig,
  createWorkspaceFromConfig,
  resolveConfig,
} from '../core/config/resolveConfig'
import {resolveSchemaTypes} from '../core/config/resolveSchemaTypes'
import {SchemaError} from '../core/config/SchemaError'
import {
  type Config,
  type ConfigContext,
  DECISION_PARAMETERS_SCHEMA,
  type DocumentActionsContext,
  type DocumentActionsVersionType,
  type DocumentLanguageFilterComponent,
  type DocumentLayoutProps,
  type MediaLibraryConfig,
  type PartialContext,
  type PluginOptions,
  QUOTA_EXCLUDED_RELEASES_ENABLED,
  type Source,
  type SourceClientOptions,
  type Tool,
  type Workspace,
  type WorkspaceOptions,
} from '../core/config/types'
import {
  getConfigContextFromSource,
  useConfigContextFromSource,
} from '../core/config/useConfigContextFromSource'
import {useSanityCreateConfig} from '../core/create/context/useSanityCreateConfig'
import {
  getSanityCreateLinkMetadata,
  isSanityCreateExcludedType,
  isSanityCreateLinked,
  isSanityCreateLinkedDocument,
  isSanityCreateStartCompatibleDoc,
} from '../core/create/createUtils'
import {type CreateLinkMetadata} from '../core/create/types'
import {isDev, isProd} from '../core/environment'
import {
  getAnnotationAtPath,
  getAnnotationColor,
  getDiffAtPath,
  visitDiff,
} from '../core/field/diff/annotations/helpers'
import {useAnnotationColor, useDiffAnnotationColor} from '../core/field/diff/annotations/hooks'
import {ChangeBreadcrumb} from '../core/field/diff/components/ChangeBreadcrumb'
import {ChangeList} from '../core/field/diff/components/ChangeList'
import {ChangeResolver} from '../core/field/diff/components/ChangeResolver'
import {ChangesError} from '../core/field/diff/components/ChangesError'
import {ChangeTitleSegment} from '../core/field/diff/components/ChangeTitleSegment'
import {TIMELINE_ITEM_I18N_KEY_MAPPING} from '../core/field/diff/components/constants'
import {DiffCard} from '../core/field/diff/components/DiffCard'
import {DiffErrorBoundary} from '../core/field/diff/components/DiffErrorBoundary'
import {DiffFromTo} from '../core/field/diff/components/DiffFromTo'
import {DiffInspectWrapper} from '../core/field/diff/components/DiffInspectWrapper'
import {DiffString, DiffStringSegment} from '../core/field/diff/components/DiffString'
import {DiffTooltip} from '../core/field/diff/components/DiffTooltip'
import {FallbackDiff} from '../core/field/diff/components/FallbackDiff'
import {FieldChange} from '../core/field/diff/components/FieldChange'
import {FromTo} from '../core/field/diff/components/FromTo'
import {FromToArrow} from '../core/field/diff/components/FromToArrow'
import {GroupChange} from '../core/field/diff/components/GroupChange'
import {MetaInfo} from '../core/field/diff/components/MetaInfo'
import {NoChanges} from '../core/field/diff/components/NoChanges'
import {RevertChangesButton} from '../core/field/diff/components/RevertChangesButton'
import {TimelineEvent} from '../core/field/diff/components/TimelineEvent'
import {ValueError} from '../core/field/diff/components/ValueError'
import {type DocumentChangeContextInstance} from '../core/field/diff/contexts/DocumentChangeContext'
import {
  isAddedItemDiff,
  isFieldChange,
  isGroupChange,
  isRemovedItemDiff,
  isUnchangedDiff,
} from '../core/field/diff/helpers'
import {useDocumentChange} from '../core/field/diff/hooks/useDocumentChange'
import {diffResolver} from '../core/field/diff/resolve/diffResolver'
import {resolveDiffComponent} from '../core/field/diff/resolve/resolveDiffComponent'
import {
  getItemKey,
  getItemKeySegment,
  getValueAtPath,
  normalizeIndexSegment,
  normalizeIndexTupleSegment,
  normalizeKeySegment,
  normalizePathSegment,
  pathsAreEqual,
  pathToString,
  stringToPath,
} from '../core/field/paths/helpers'
import {
  type AnnotationDetails,
  type Chunk,
  type ChunkType,
  type Diff,
  type ObjectDiff,
} from '../core/field/types'
import {getValueError} from '../core/field/validation'
import {type FIXME} from '../core/FIXME'
import {EditPortal} from '../core/form/components/EditPortal'
import {FormField} from '../core/form/components/formField/FormField'
import {FormFieldHeaderText} from '../core/form/components/formField/FormFieldHeaderText'
import {FormFieldSet} from '../core/form/components/formField/FormFieldSet'
import {FormFieldStatus} from '../core/form/components/formField/FormFieldStatus'
import {FormFieldValidationStatus} from '../core/form/components/formField/FormFieldValidationStatus'
import {FormInput} from '../core/form/components/FormInput'
import {FormValueProvider, useFormValue} from '../core/form/contexts/FormValue'
import {GetFormValueProvider, useGetFormValue} from '../core/form/contexts/GetFormValue'
import {FieldActionMenu} from '../core/form/field/actions/FieldActionMenu'
import {FieldActionsProvider} from '../core/form/field/actions/FieldActionsProvider'
import {FieldActionsResolver} from '../core/form/field/actions/FieldActionsResolver'
import {useFieldActions} from '../core/form/field/actions/useFieldActions'
import {HoveredFieldProvider} from '../core/form/field/HoveredFieldProvider'
import {useHoveredField} from '../core/form/field/useHoveredField'
import {useDidUpdate} from '../core/form/hooks/useDidUpdate'
import {BlockEditor} from '../core/form/inputs'
import {ArrayOfObjectsFunctions} from '../core/form/inputs/arrays/ArrayOfObjectsInput/ArrayOfObjectsFunctions'
import {ArrayOfObjectsInput} from '../core/form/inputs/arrays/ArrayOfObjectsInput/ArrayOfObjectsInput'
import {useVirtualizerScrollInstance} from '../core/form/inputs/arrays/ArrayOfObjectsInput/List/useVirtualizerScrollInstance'
import {VirtualizerScrollInstanceProvider} from '../core/form/inputs/arrays/ArrayOfObjectsInput/List/VirtualizerScrollInstanceProvider'
import {ArrayOfObjectOptionsInput} from '../core/form/inputs/arrays/ArrayOfOptionsInput/ArrayOfObjectOptionsInput'
import {ArrayOfOptionsInput} from '../core/form/inputs/arrays/ArrayOfOptionsInput/ArrayOfOptionsInput'
import {ArrayOfPrimitiveOptionsInput} from '../core/form/inputs/arrays/ArrayOfOptionsInput/ArrayOfPrimitiveOptionsInput'
import {ArrayOfPrimitivesFunctions} from '../core/form/inputs/arrays/ArrayOfPrimitivesInput/ArrayOfPrimitivesFunctions'
import {ArrayOfPrimitivesInput} from '../core/form/inputs/arrays/ArrayOfPrimitivesInput/ArrayOfPrimitivesInput'
import {UniversalArrayInput} from '../core/form/inputs/arrays/UniversalArrayInput'
import {BooleanInput} from '../core/form/inputs/BooleanInput'
import {CrossDatasetReferenceInput} from '../core/form/inputs/CrossDatasetReferenceInput/CrossDatasetReferenceInput'
import {DateInput} from '../core/form/inputs/DateInputs/DateInput'
import {DateTimeInput} from '../core/form/inputs/DateInputs/DateTimeInput'
import {getCalendarLabels} from '../core/form/inputs/DateInputs/utils'
import {EmailInput} from '../core/form/inputs/EmailInput'
import {NumberInput} from '../core/form/inputs/NumberInput/NumberInput'
import {ObjectInput} from '../core/form/inputs/ObjectInput/ObjectInput'
import {PortableTextInput} from '../core/form/inputs/PortableText/PortableTextInput'
import {SelectInput} from '../core/form/inputs/SelectInput'
import {SlugInput} from '../core/form/inputs/Slug/SlugInput'
import {StringInput} from '../core/form/inputs/StringInput/StringInput'
import {TagsArrayInput} from '../core/form/inputs/TagsArrayInput'
import {TelephoneInput} from '../core/form/inputs/TelephoneInput'
import {TextInput} from '../core/form/inputs/TextInput'
import {UrlInput} from '../core/form/inputs/UrlInput'
import {ArrayOfObjectsInputMember} from '../core/form/members/array/ArrayOfObjectsInputMember'
import {ArrayOfObjectsInputMembers} from '../core/form/members/array/ArrayOfObjectsInputMembers'
import {ArrayOfObjectsItem} from '../core/form/members/array/items/ArrayOfObjectsItem'
import {ArrayOfPrimitivesItem} from '../core/form/members/array/items/ArrayOfPrimitivesItem'
import {MemberItemError} from '../core/form/members/array/MemberItemError'
import {MemberField} from '../core/form/members/object/MemberField'
import {MemberFieldError} from '../core/form/members/object/MemberFieldError'
import {MemberFieldSet} from '../core/form/members/object/MemberFieldset'
import {ObjectInputMember} from '../core/form/members/object/ObjectInputMember'
import {ObjectInputMembers, ObjectMembers} from '../core/form/members/object/ObjectInputMembers'
import {
  dec,
  diffMatchPatch,
  inc,
  insert,
  prefixPath,
  SANITY_PATCH_TYPE,
  set,
  setIfMissing,
  unset,
} from '../core/form/patch/patch'
import {createPatchChannel, type PatchMsg} from '../core/form/patch/PatchChannel'
import {PatchEvent} from '../core/form/patch/PatchEvent'
import {resolveConditionalProperty} from '../core/form/store/conditional-property/resolveConditionalProperty'
import {ALL_FIELDS_GROUP} from '../core/form/store/constants'
import {setAtPath} from '../core/form/store/stateTreeHelper'
import {type DocumentFormNode, type NodeChronologyProps} from '../core/form/store/types/nodes'
import {type StateTree} from '../core/form/store/types/state'
import {useFormState} from '../core/form/store/useFormState'
import {getExpandOperations} from '../core/form/store/utils/getExpandOperations'
import {FormCallbacksProvider, useFormCallbacks} from '../core/form/studio/contexts/FormCallbacks'
import {
  type ReferenceInputOptions,
  ReferenceInputOptionsProvider,
  useReferenceInputOptions,
} from '../core/form/studio/contexts/ReferenceInputOptions'
import {
  defaultRenderAnnotation,
  defaultRenderBlock,
  defaultRenderField,
  defaultRenderInlineBlock,
  defaultRenderInput,
  defaultRenderItem,
  defaultRenderPreview,
} from '../core/form/studio/defaults'
import {FormBuilder} from '../core/form/studio/FormBuilder'
import {FormProvider} from '../core/form/studio/FormProvider'
import {FileInput, ImageInput, ReferenceInput} from '../core/form/studio/inputs'
import {useTreeEditingEnabled} from '../core/form/studio/tree-editing/context/enabled/useTreeEditingEnabled'
import {
  isArrayOfBlocksInputProps,
  isArrayOfObjectsInputProps,
  isArrayOfPrimitivesInputProps,
  isBooleanInputProps,
  isNumberInputProps,
  isObjectInputProps,
  isObjectItemProps,
  isStringInputProps,
} from '../core/form/types/asserters'
import {type FormDocumentValue} from '../core/form/types/formDocumentValue'
import {type InputProps} from '../core/form/types/inputProps'
import {useDocumentForm} from '../core/form/useDocumentForm'
import {useFormBuilder} from '../core/form/useFormBuilder'
import {fromMutationPatches, toMutationPatches} from '../core/form/utils/mutationPatch'
import {decodePath, encodePath} from '../core/form/utils/path'
import {TransformPatches} from '../core/form/utils/TransformPatches'
import {useClient} from '../core/hooks/useClient'
import {useConditionalToast} from '../core/hooks/useConditionalToast'
import {useConnectionState} from '../core/hooks/useConnectionState'
import {useDataset} from '../core/hooks/useDataset'
import {useDateTimeFormat, type UseDateTimeFormatOptions} from '../core/hooks/useDateTimeFormat'
import {type DocumentIdStack, useDocumentIdStack} from '../core/hooks/useDocumentIdStack'
import {useDocumentOperation} from '../core/hooks/useDocumentOperation'
import {useDocumentOperationEvent} from '../core/hooks/useDocumentOperationEvent'
import {useEditState} from '../core/hooks/useEditState'
import {useFeatureEnabled} from '../core/hooks/useFeatureEnabled'
import {useFilteredReleases} from '../core/hooks/useFilteredReleases'
import {useFormattedDuration} from '../core/hooks/useFormattedDuration'
import {useGlobalCopyPasteElementHandler} from '../core/hooks/useGlobalCopyPasteElementHandler'
import {useListFormat} from '../core/hooks/useListFormat'
import {useManageFavorite, type UseManageFavoriteProps} from '../core/hooks/useManageFavorite'
import {useNumberFormat} from '../core/hooks/useNumberFormat'
import {useProjectId} from '../core/hooks/useProjectId'
import {useReconnectingToast} from '../core/hooks/useReconnectingToast'
import {useReferringDocuments} from '../core/hooks/useReferringDocuments'
import {type RelativeTimeOptions, useRelativeTime} from '../core/hooks/useRelativeTime'
import {useReviewChanges} from '../core/hooks/useReviewChanges'
import {useSchema} from '../core/hooks/useSchema'
import {useStudioUrl} from '../core/hooks/useStudioUrl'
import {useSyncState} from '../core/hooks/useSyncState'
import {useTemplates} from '../core/hooks/useTemplates'
import {useTimeAgo} from '../core/hooks/useTimeAgo'
import {useTools} from '../core/hooks/useTools'
import {useUnitFormatter} from '../core/hooks/useUnitFormatter'
import {useUserListWithPermissions} from '../core/hooks/useUserListWithPermissions'
import {useValidationStatus} from '../core/hooks/useValidationStatus'
import {useWorkspaceSchemaId} from '../core/hooks/useWorkspaceSchemaId'
import {LocaleProvider, LocaleProviderBase} from '../core/i18n/components/LocaleProvider'
import {
  defineLocale,
  defineLocaleResourceBundle,
  defineLocalesResources,
  removeUndefinedLocaleResources,
} from '../core/i18n/helpers'
import {useGetI18nText} from '../core/i18n/hooks/useGetI18nText'
import {useI18nText} from '../core/i18n/hooks/useI18nText'
import {useCurrentLocale, useLocale} from '../core/i18n/hooks/useLocale'
import {useTranslation} from '../core/i18n/hooks/useTranslation'
import {defaultLocale, usEnglishLocale} from '../core/i18n/locales'
import {Translate} from '../core/i18n/Translate'
import {
  type LocaleResourceBundle,
  type LocaleSource,
  type StudioLocaleResourceKeys,
  type TFunction,
} from '../core/i18n/types'
import {useDocumentLimitsUpsellContext} from '../core/limits/context/documents/DocumentLimitUpsellProvider'
import {isDocumentLimitError} from '../core/limits/context/documents/isDocumentLimitError'
import {
  isPerspectiveWriteable,
  type PerspectiveNotWriteableReason,
} from '../core/perspective/isPerspectiveWriteable'
import {ReleasesNav} from '../core/perspective/navbar/ReleasesNav'
import {PerspectiveProvider} from '../core/perspective/PerspectiveProvider'
import {
  type PerspectiveContextValue,
  type PerspectiveStack,
  type ReleaseId,
  type ReleasesNavMenuItemPropsGetter,
  type SelectedPerspective,
  type TargetPerspective,
} from '../core/perspective/types'
import {useExcludedPerspective} from '../core/perspective/useExcludedPerspective'
import {usePerspective} from '../core/perspective/usePerspective'
import {useSetPerspective} from '../core/perspective/useSetPerspective'
import {DocumentPreviewPresence} from '../core/presence/DocumentPreviewPresence'
import {
  FieldPresence,
  FieldPresenceInner,
  FieldPresenceWithOverlay,
} from '../core/presence/FieldPresence'
import {PresenceOverlay} from '../core/presence/overlay/PresenceOverlay'
import {PresenceScope} from '../core/presence/PresenceScope'
import {unstable_useObserveDocument} from '../core/preview'
import {Preview} from '../core/preview/components/Preview'
import {PreviewLoader} from '../core/preview/components/PreviewLoader'
import {SanityDefaultPreview} from '../core/preview/components/SanityDefaultPreview'
import {
  createDocumentPreviewStore,
  type DocumentPreviewStore,
} from '../core/preview/documentPreviewStore'
import {
  type AvailabilityResponse,
  type DocumentAvailability,
  type PreviewableType,
} from '../core/preview/types'
import {unstable_useValuePreview} from '../core/preview/useValuePreview'
import {getPreviewPaths} from '../core/preview/utils/getPreviewPaths'
import {getPreviewStateObservable} from '../core/preview/utils/getPreviewStateObservable'
import {getPreviewValueWithFallback} from '../core/preview/utils/getPreviewValueWithFallback'
import {prepareForPreview} from '../core/preview/utils/prepareForPreview'
import {VersionChip} from '../core/releases/components/documentHeader/VersionChip'
import {ReleaseAvatar} from '../core/releases/components/ReleaseAvatar'
import {
  getVersionInlineBadge,
  VersionInlineBadge,
} from '../core/releases/components/VersionInlineBadge'
import {useDocumentVersions} from '../core/releases/hooks/useDocumentVersions'
import {useDocumentVersionTypeSortedList} from '../core/releases/hooks/useDocumentVersionTypeSortedList'
import {useIsReleaseActive} from '../core/releases/hooks/useIsReleaseActive'
import {useOnlyHasVersions} from '../core/releases/hooks/useOnlyHasVersions'
import {useVersionOperations} from '../core/releases/hooks/useVersionOperations'
import {RELEASES_INTENT} from '../core/releases/plugin'
import {isReleaseDocument} from '../core/releases/store/types'
import {useActiveReleases} from '../core/releases/store/useActiveReleases'
import {useArchivedReleases} from '../core/releases/store/useArchivedReleases'
import {useDocumentVersionInfo} from '../core/releases/store/useDocumentVersionInfo'
import {useReleasesIds} from '../core/releases/store/useReleasesIds'
import {LATEST, PUBLISHED} from '../core/releases/util/const'
import {getReleaseIdFromReleaseDocumentId} from '../core/releases/util/getReleaseIdFromReleaseDocumentId'
import {getReleaseTone} from '../core/releases/util/getReleaseTone'
import {isGoingToUnpublish} from '../core/releases/util/isGoingToUnpublish'
import {
  isReleasePerspective,
  RELEASES_STUDIO_CLIENT_OPTIONS,
} from '../core/releases/util/releasesClient'
import {
  formatRelativeLocalePublishDate,
  isDraftPerspective,
  isPublishedPerspective,
  isReleaseScheduledOrScheduling,
} from '../core/releases/util/util'
// oxlint-disable-next-line no-restricted-imports
import {EditScheduleForm} from '../core/scheduled-publishing/components/editScheduleForm/EditScheduleForm'
// oxlint-disable-next-line no-restricted-imports
import {ScheduledBadge} from '../core/scheduled-publishing/plugin/documentBadges/scheduled/ScheduledBadge'
import {createSchema} from '../core/schema/createSchema'
import {getSchemaTypeTitle} from '../core/schema/helpers'
import {getSearchableTypes} from '../core/search/common/getSearchableTypes'
import {isPerspectiveRaw} from '../core/search/common/isPerspectiveRaw'
import {type SearchOptions, type SearchSort} from '../core/search/common/types'
import {createSearch} from '../core/search/search'
import {_createAuthStore, createAuthStore} from '../core/store/_legacy/authStore/createAuthStore'
import {createMockAuthStore} from '../core/store/_legacy/authStore/createMockAuthStore'
import {getProviderTitle} from '../core/store/_legacy/authStore/providerTitle'
import {
  isAuthStore,
  isCookielessCompatibleLoginMethod,
} from '../core/store/_legacy/authStore/utils/asserters'
import {
  CONNECTING,
  createConnectionStatusStore,
  onRetry,
} from '../core/store/_legacy/connection-status/connection-status-store'
import {
  useConnectionStatusStore,
  useDocumentPreviewStore,
  useDocumentStore,
  useGrantsStore,
  useHistoryStore,
  useKeyValueStore,
  usePresenceStore,
  useProjectStore,
  useRenderingContextStore,
  useUserStore,
} from '../core/store/_legacy/datastores'
import {createBufferedDocument} from '../core/store/_legacy/document/buffered-doc/createBufferedDocument'
import {createObservableBufferedDocument} from '../core/store/_legacy/document/buffered-doc/createObservableBufferedDocument'
import {
  type DocumentMutationEvent,
  type DocumentRebaseEvent,
} from '../core/store/_legacy/document/buffered-doc/types'
import {checkoutPair} from '../core/store/_legacy/document/document-pair/checkoutPair'
import {editState, type EditStateFor} from '../core/store/_legacy/document/document-pair/editState'
import {
  emitOperation,
  operationEvents,
} from '../core/store/_legacy/document/document-pair/operationEvents'
import {remoteSnapshots} from '../core/store/_legacy/document/document-pair/remoteSnapshots'
import {snapshotPair} from '../core/store/_legacy/document/document-pair/snapshotPair'
import {validation} from '../core/store/_legacy/document/document-pair/validation'
import {
  createDocumentStore,
  type DocumentStore,
  type QueryParams,
} from '../core/store/_legacy/document/document-store'
import {getPairListener} from '../core/store/_legacy/document/getPairListener'
import {useDocumentType} from '../core/store/_legacy/document/hooks/useDocumentType'
import {useDocumentValues} from '../core/store/_legacy/document/hooks/useDocumentValues'
import {getInitialValueStream} from '../core/store/_legacy/document/initialValue/initialValue'
import {isNewDocument} from '../core/store/_legacy/document/isNewDocument'
import {listenQuery} from '../core/store/_legacy/document/listenQuery'
import {selectUpstreamVersion} from '../core/store/_legacy/document/selectUpstreamVersion'
import {
  useInitialValue,
  useInitialValueResolverContext,
} from '../core/store/_legacy/document/useInitialValue'
import {useResolveInitialValueForType} from '../core/store/_legacy/document/useResolveInitialValueForType'
import {
  getDocumentPairPermissions,
  useDocumentPairPermissions,
  useDocumentPairPermissionsFromHookFactory,
} from '../core/store/_legacy/grants/documentPairPermissions'
import {
  getDocumentValuePermissions,
  useDocumentValuePermissions,
} from '../core/store/_legacy/grants/documentValuePermissions'
import {createGrantsStore, grantsPermissionOn} from '../core/store/_legacy/grants/grantsStore'
import {
  getTemplatePermissions,
  type TemplatePermissionsResult,
  useTemplatePermissions,
  useTemplatePermissionsFromHookFactory,
} from '../core/store/_legacy/grants/templatePermissions'
import {
  type DocumentValuePermission,
  type PermissionCheckResult,
} from '../core/store/_legacy/grants/types'
import {
  createHistoryStore,
  removeMissingReferences,
} from '../core/store/_legacy/history/createHistoryStore'
import {Timeline} from '../core/store/_legacy/history/history/Timeline'
import {TimelineController} from '../core/store/_legacy/history/history/TimelineController'
import {useTimelineSelector} from '../core/store/_legacy/history/useTimelineSelector'
import {type TimelineStore, useTimelineStore} from '../core/store/_legacy/history/useTimelineStore'
import {createPresenceStore, SESSION_ID} from '../core/store/_legacy/presence/presence-store'
import {type DocumentPresence} from '../core/store/_legacy/presence/types'
import {useDocumentPresence} from '../core/store/_legacy/presence/useDocumentPresence'
import {useGlobalPresence} from '../core/store/_legacy/presence/useGlobalPresence'
import {createProjectStore} from '../core/store/_legacy/project/projectStore'
import {useProject} from '../core/store/_legacy/project/useProject'
import {useProjectDatasets} from '../core/store/_legacy/project/useProjectDatasets'
import {ResourceCacheProvider, useResourceCache} from '../core/store/_legacy/ResourceCacheProvider'
import {createUserStore} from '../core/store/_legacy/user/userStore'
import {EventsProvider, useEvents} from '../core/store/events/EventsProvider'
import {
  type DocumentGroupEvent,
  isCreateDocumentVersionEvent,
  isCreateLiveDocumentEvent,
  isDeleteDocumentGroupEvent,
  isDeleteDocumentVersionEvent,
  isEditDocumentVersionEvent,
  isPublishDocumentVersionEvent,
  isScheduleDocumentVersionEvent,
  isUnpublishDocumentEvent,
  isUnscheduleDocumentVersionEvent,
  isUpdateLiveDocumentEvent,
  type PublishDocumentVersionEvent,
} from '../core/store/events/types'
import {useEventsStore} from '../core/store/events/useEventsStore'
import {createKeyValueStore} from '../core/store/key-value/keyValueStore'
import {type KeyValueStoreValue} from '../core/store/key-value/types'
import {useCurrentUser, useUser} from '../core/store/user/hooks'
import {ActiveWorkspaceMatcher} from '../core/studio/activeWorkspaceMatcher/ActiveWorkspaceMatcher'
import {matchWorkspace} from '../core/studio/activeWorkspaceMatcher/matchWorkspace'
import {useActiveWorkspace} from '../core/studio/activeWorkspaceMatcher/useActiveWorkspace'
import {AddonDatasetProvider} from '../core/studio/addonDataset/AddonDatasetProvider'
import {useAddonDataset} from '../core/studio/addonDataset/useAddonDataset'
import {
  ColorSchemeCustomProvider,
  ColorSchemeLocalStorageProvider,
  ColorSchemeProvider,
  useColorScheme,
  useColorSchemeInternalValue,
  useColorSchemeOptions,
  useColorSchemeSetValue,
  useColorSchemeValue,
} from '../core/studio/colorScheme'
import {Filters} from '../core/studio/components/navbar/search/components/filters/Filters'
import {SearchHeader} from '../core/studio/components/navbar/search/components/SearchHeader'
import {SearchPopover} from '../core/studio/components/navbar/search/components/SearchPopover'
import {SearchResultItemPreview} from '../core/studio/components/navbar/search/components/searchResults/item/SearchResultItemPreview'
import {SearchProvider} from '../core/studio/components/navbar/search/contexts/search/SearchProvider'
import {useSearchState} from '../core/studio/components/navbar/search/contexts/search/useSearchState'
import {
  defineSearchFilter,
  defineSearchFilterOperators,
} from '../core/studio/components/navbar/search/definitions/filters'
import {operatorDefinitions} from '../core/studio/components/navbar/search/definitions/operators/defaultOperators'
import {defineSearchOperator} from '../core/studio/components/navbar/search/definitions/operators/operatorTypes'
import {useSearchMaxFieldDepth} from '../core/studio/components/navbar/search/hooks/useSearchMaxFieldDepth'
import {SearchButton} from '../core/studio/components/navbar/search/SearchButton'
import {SearchDialog} from '../core/studio/components/navbar/search/SearchDialog'
import {StudioLogo} from '../core/studio/components/navbar/StudioLogo'
import {StudioNavbar} from '../core/studio/components/navbar/StudioNavbar'
import {StudioToolMenu} from '../core/studio/components/navbar/tools/StudioToolMenu'
import {ToolLink} from '../core/studio/components/navbar/tools/ToolLink'
import {CopyPasteProvider, useCopyPaste} from '../core/studio/copyPaste/CopyPasteProvider'
import {renderStudio} from '../core/studio/renderStudio'
import {SourceProvider, useSource} from '../core/studio/source'
import {Studio} from '../core/studio/Studio'
import {StudioAnnouncementsCard} from '../core/studio/studioAnnouncements/StudioAnnouncementsCard'
import {StudioAnnouncementsDialog} from '../core/studio/studioAnnouncements/StudioAnnouncementsDialog'
import {
  isValidAnnouncementAudience,
  isValidAnnouncementRole,
} from '../core/studio/studioAnnouncements/utils'
import {StudioLayout, StudioLayoutComponent} from '../core/studio/StudioLayout'
import {StudioProvider} from '../core/studio/StudioProvider'
import {
  UpsellDialogDismissed,
  UpsellDialogLearnMoreCtaClicked,
  UpsellDialogUpgradeCtaClicked,
  UpsellDialogViewed,
} from '../core/studio/upsell/__telemetry__/upsell.telemetry'
import {UpsellDescriptionSerializer} from '../core/studio/upsell/upsellDescriptionSerializer/UpsellDescriptionSerializer'
import {useWorkspace, WorkspaceProvider} from '../core/studio/workspace'
import {ErrorMessage} from '../core/studio/workspaceLoader/ErrorMessage'
import {useWorkspaceLoader, WorkspaceLoader} from '../core/studio/workspaceLoader/WorkspaceLoader'
import {
  getNamelessWorkspaceIdentifier,
  getWorkspaceIdentifier,
} from '../core/studio/workspaces/helpers'
import {useWorkspaces} from '../core/studio/workspaces/useWorkspaces'
import {
  validateBasePaths,
  validateNames,
  validateWorkspaces,
} from '../core/studio/workspaces/validateWorkspaces'
import {WorkspacesProvider} from '../core/studio/workspaces/WorkspacesProvider'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../core/studioClient'
import {IsLastPaneProvider} from '../core/tasks/context/isLastPane/IsLastPaneProvider'
import {
  defaultTemplateForType,
  defaultTemplatesForSchema,
  prepareTemplates,
} from '../core/templates/prepare'
import {
  DEFAULT_MAX_RECURSION_DEPTH,
  isBuilder,
  resolveInitialObjectValue,
  resolveInitialValue,
  resolveInitialValueForType,
} from '../core/templates/resolve'
import {type InitialValueTemplateItem, type Template} from '../core/templates/types'
import {defaultTheme} from '../core/theme'
import {buildLegacyTheme} from '../core/theme/_legacy/theme'
import {useUserColor, useUserColorManager} from '../core/user-color/hooks'
import {createUserColorManager} from '../core/user-color/manager'
import {UserColorManagerProvider} from '../core/user-color/provider'
import {catchWithCount} from '../core/util/catchWithCount'
import {createHookFromObservableFactory} from '../core/util/createHookFromObservableFactory'
import {
  collate,
  createDraftFrom,
  createPublishedFrom,
  documentIdEquals,
  DRAFTS_FOLDER,
  getDraftId,
  getIdPair,
  getPublishedId,
  getVersionFromId,
  getVersionId,
  isDraft,
  isDraftId,
  isPublishedId,
  isSystemBundle,
  isSystemBundleName,
  isVersionId,
  newDraftFrom,
  type PublishedId,
  removeDupes,
  systemBundles,
  VERSION_FOLDER,
} from '../core/util/draftUtils'
import {EMPTY_ARRAY, EMPTY_OBJECT} from '../core/util/empty'
import {formatRelativeLocale} from '../core/util/formatRelativeLocale'
import {getDocumentVariantType} from '../core/util/getDocumentVariantType'
import {globalScope} from '../core/util/globalScope'
import {isArray} from '../core/util/isArray'
import {isNonNullable} from '../core/util/isNonNullable'
import {isRecord} from '../core/util/isRecord'
import {isString} from '../core/util/isString'
import {isTruthy} from '../core/util/isTruthy'
import {isCardinalityOnePerspective, isCardinalityOneRelease} from '../core/util/releaseUtils'
import {createSharedResizeObserver, resizeObserver} from '../core/util/resizeObserver'
import {createSWR} from '../core/util/rxSwr'
import {
  _isCustomDocumentTypeDefinition,
  _isSanityDocumentTypeDefinition,
} from '../core/util/schemaUtils'
import {escapeField, fieldNeedsEscape, joinPath} from '../core/util/searchUtils'
import {supportsTouch} from '../core/util/supportsTouch'
import {uncaughtErrorHandler} from '../core/util/uncaughtErrorHandler'
import {sliceString, truncateString} from '../core/util/unicodeString'
import {asLoadable, useLoadable} from '../core/util/useLoadable'
import {userHasRole} from '../core/util/userHasRole'
import {useThrottledCallback} from '../core/util/useThrottledCallback'
import {useUnique} from '../core/util/useUnique'
import {Rule as ConcreteRuleClass} from '../core/validation/Rule'
import {validateDocument} from '../core/validation/validateDocument'
import {SANITY_VERSION} from '../core/version'

export {
  _createAuthStore,
  _isCustomDocumentTypeDefinition,
  _isSanityDocumentTypeDefinition,
  ActiveWorkspaceMatcher,
  AddonDatasetProvider,
  ALL_FIELDS_GROUP,
  ArrayOfObjectOptionsInput,
  ArrayOfObjectsFunctions,
  ArrayOfObjectsInput,
  ArrayOfObjectsInputMember,
  ArrayOfObjectsInputMembers,
  ArrayOfObjectsItem,
  ArrayOfOptionsInput,
  ArrayOfPrimitiveOptionsInput,
  ArrayOfPrimitivesFunctions,
  ArrayOfPrimitivesInput,
  ArrayOfPrimitivesItem,
  asLoadable,
  AutoCollapseMenu,
  AvatarSkeleton,
  BetaBadge,
  BlockEditor,
  BlockImagePreview,
  BlockPreview,
  BooleanInput,
  buildCommentRangeDecorations,
  buildLegacyTheme,
  buildRangeDecorationSelectionsFromComments,
  buildTextSelectionFromFragment,
  ChangeBreadcrumb,
  ChangeConnectorRoot,
  ChangeFieldWrapper,
  ChangeIndicator,
  ChangeIndicatorsTracker,
  ChangeList,
  ChangeResolver,
  ChangesError,
  ChangeTitleSegment,
  checkoutPair,
  CircularProgress,
  CollapseMenu,
  CollapseMenuButton,
  collate,
  ColorSchemeCustomProvider,
  ColorSchemeLocalStorageProvider,
  ColorSchemeProvider,
  CommandList,
  CommentDeleteDialog,
  CommentDisabledIcon,
  CommentInlineHighlightSpan,
  CommentInput,
  COMMENTS_INSPECTOR_NAME,
  CommentsAuthoringPathProvider,
  CommentsEnabledProvider,
  CommentsIntentProvider,
  CommentsList,
  CommentsProvider,
  CommentsSelectedPathProvider,
  CompactPreview,
  ConcreteRuleClass,
  ConfigPropertyError,
  ConfigResolutionError,
  CONNECTING,
  ContextMenuButton,
  CopyPasteProvider,
  CorsOriginError,
  createAuthStore,
  createBufferedDocument,
  createConfig,
  createConnectionStatusStore,
  createDefaultIcon,
  createDocumentPreviewStore,
  createDocumentStore,
  createDraftFrom,
  createGrantsStore,
  createHistoryStore,
  createHookFromObservableFactory,
  createKeyValueStore,
  createMockAuthStore,
  createObservableBufferedDocument,
  createPatchChannel,
  createPlugin,
  createPresenceStore,
  createProjectStore,
  createPublishedFrom,
  createSchema,
  createSearch,
  createSharedResizeObserver,
  createSourceFromConfig,
  createSWR,
  createUserColorManager,
  createUserStore,
  createWorkspaceFromConfig,
  CrossDatasetReferenceInput,
  DateInput,
  DateTimeInput,
  dec,
  DECISION_PARAMETERS_SCHEMA,
  decodePath,
  DEFAULT_MAX_RECURSION_DEPTH,
  DEFAULT_STUDIO_CLIENT_OPTIONS,
  defaultLocale,
  DefaultPreview,
  defaultRenderAnnotation,
  defaultRenderBlock,
  defaultRenderField,
  defaultRenderInlineBlock,
  defaultRenderInput,
  defaultRenderItem,
  defaultRenderPreview,
  defaultTemplateForType,
  defaultTemplatesForSchema,
  defaultTheme,
  defineArrayMember,
  defineConfig,
  defineDocumentFieldAction,
  defineDocumentInspector,
  defineField,
  defineLocale,
  defineLocaleResourceBundle,
  defineLocalesResources,
  definePlugin,
  defineSearchFilter,
  defineSearchFilterOperators,
  defineSearchOperator,
  defineType,
  DetailPreview,
  DiffCard,
  DiffErrorBoundary,
  DiffFromTo,
  DiffInspectWrapper,
  diffMatchPatch,
  diffResolver,
  DiffString,
  DiffStringSegment,
  DiffTooltip,
  documentFieldActionsReducer,
  documentIdEquals,
  type DocumentIdStack,
  DocumentPreviewPresence,
  DocumentStatus,
  DocumentStatusIndicator,
  DRAFTS_FOLDER,
  EditPortal,
  EditScheduleForm,
  editState,
  EmailInput,
  emitOperation,
  EMPTY_ARRAY,
  EMPTY_OBJECT,
  encodePath,
  ErrorActions,
  ErrorMessage,
  escapeField,
  TimelineEvent as Event,
  EventsProvider,
  FallbackDiff,
  FieldActionMenu,
  FieldActionsProvider,
  FieldActionsResolver,
  FieldChange,
  fieldNeedsEscape,
  FieldPresence,
  FieldPresenceInner,
  FieldPresenceWithOverlay,
  FileInput,
  Filters,
  findIndex, //todo
  flattenConfig,
  formatRelativeLocale,
  formatRelativeLocalePublishDate,
  FormBuilder,
  FormCallbacksProvider,
  FormField,
  FormFieldHeaderText,
  FormFieldSet,
  FormFieldStatus,
  FormFieldValidationStatus,
  FormInput,
  FormProvider,
  FormValueProvider,
  fromMutationPatches,
  FromTo,
  FromToArrow,
  getAnnotationAtPath,
  getAnnotationColor,
  getCalendarLabels,
  getConfigContextFromSource,
  getDiffAtPath,
  getDocumentPairPermissions,
  getDocumentValuePermissions,
  getDocumentVariantType,
  getDraftId,
  getExpandOperations,
  GetFormValueProvider,
  GetHookCollectionState,
  getIdPair,
  getInitialValueStream,
  getItemKey,
  getItemKeySegment,
  getNamelessWorkspaceIdentifier,
  getPairListener,
  getPreviewPaths,
  getPreviewStateObservable,
  getPreviewValueWithFallback,
  getProviderTitle,
  getPublishedId,
  getReleaseIdFromReleaseDocumentId,
  getReleaseTone,
  getSanityCreateLinkMetadata,
  getSchemaTypeTitle,
  getSearchableTypes,
  getTemplatePermissions,
  getValueAtPath,
  getValueError,
  getVersionFromId,
  getVersionId,
  getVersionInlineBadge,
  getWorkspaceIdentifier,
  globalScope,
  grantsPermissionOn,
  GroupChange,
  hasCommentMessageValue,
  Hotkeys,
  HoveredFieldProvider,
  ImageInput,
  ImperativeToast,
  inc,
  initialDocumentFieldActions,
  InlinePreview,
  insert,
  InsufficientPermissionsMessage,
  IntentButton,
  isAddedItemDiff,
  isArray,
  isArrayOfBlocksInputProps,
  isArrayOfBlocksSchemaType,
  isArrayOfObjectsInputProps,
  isArrayOfObjectsSchemaType,
  isArrayOfPrimitivesInputProps,
  isArrayOfPrimitivesSchemaType,
  isArraySchemaType,
  isAuthStore,
  isBlockChildrenObjectField,
  isBlockListObjectField,
  isBlockSchemaType,
  isBlockStyleObjectField,
  isBooleanInputProps,
  isBooleanSchemaType,
  isBuilder,
  isCardinalityOnePerspective,
  isCardinalityOneRelease,
  isCookielessCompatibleLoginMethod,
  isCreateDocumentVersionEvent,
  isCreateIfNotExistsMutation,
  isCreateLiveDocumentEvent,
  isCreateMutation,
  isCreateOrReplaceMutation,
  isCreateSquashedMutation,
  isCrossDatasetReference,
  isCrossDatasetReferenceSchemaType,
  isDeleteDocumentGroupEvent,
  isDeleteDocumentVersionEvent,
  isDeleteMutation,
  isDeprecatedSchemaType,
  isDeprecationConfiguration,
  isDev,
  isDocumentLimitError,
  isDocumentSchemaType,
  isDraft,
  isDraftId,
  isDraftPerspective,
  isEditDocumentVersionEvent,
  isEmptyObject,
  isFieldChange,
  isFileSchemaType,
  isGlobalDocumentReference,
  isGoingToUnpublish,
  isGroupChange,
  isImage,
  isImageSchemaType,
  isIndexSegment,
  isIndexTuple,
  isKeyedObject,
  isKeySegment,
  IsLastPaneProvider,
  isNewDocument,
  isNonNullable,
  isNumberInputProps,
  isNumberSchemaType,
  isObjectInputProps,
  isObjectItemProps,
  isObjectSchemaType,
  isPatchMutation,
  isPerspectiveRaw,
  isPortableTextListBlock,
  isPortableTextSpan,
  isPortableTextTextBlock,
  isPrimitiveSchemaType,
  isProd,
  isPublishDocumentVersionEvent,
  isPublishedId,
  isPublishedPerspective,
  isRecord,
  isReference,
  isReferenceSchemaType,
  isReleaseDocument,
  isReleasePerspective,
  isReleaseScheduledOrScheduling,
  isRemovedItemDiff,
  isSanityCreateExcludedType,
  isSanityCreateLinked,
  isSanityCreateLinkedDocument,
  isSanityCreateStartCompatibleDoc,
  isSanityDefinedAction,
  isSanityDocument,
  isScheduleDocumentVersionEvent,
  isSearchStrategy,
  isSlug,
  isSpanSchemaType,
  isString,
  isStringInputProps,
  isStringSchemaType,
  isSystemBundle,
  isSystemBundleName,
  isTextSelectionComment,
  isTitledListValue,
  isTruthy,
  isTypedObject,
  isUnchangedDiff,
  isUnpublishDocumentEvent,
  isUnscheduleDocumentVersionEvent,
  isUpdateLiveDocumentEvent,
  isValidAnnouncementAudience,
  isValidAnnouncementRole,
  isValidationError,
  isValidationErrorMarker,
  isValidationInfo,
  isValidationInfoMarker,
  isValidationWarning,
  isValidationWarningMarker,
  isVersionId,
  joinPath,
  LATEST,
  LegacyLayerProvider,
  LinearProgress,
  listenQuery,
  LoadingBlock,
  LocaleProvider,
  LocaleProviderBase,
  matchWorkspace,
  MediaPreview,
  MemberField,
  MemberFieldError,
  MemberFieldSet,
  MemberItemError,
  MetaInfo,
  newDraftFrom,
  NoChanges,
  type NodeChronologyProps,
  noop,
  normalizeIndexSegment,
  normalizeIndexTupleSegment,
  normalizeKeySegment,
  normalizePathSegment,
  NumberInput,
  ObjectInput,
  ObjectInputMember,
  ObjectInputMembers,
  ObjectMembers,
  onRetry,
  operationEvents,
  operatorDefinitions,
  PatchEvent,
  pathsAreEqual,
  pathToString,
  PerspectiveProvider,
  PopoverDialog,
  PortableTextInput,
  prefixPath,
  prepareConfig,
  prepareForPreview,
  prepareTemplates,
  PresenceOverlay,
  PresenceScope,
  Preview,
  PreviewCard,
  PreviewLoader,
  PUBLISHED,
  QUOTA_EXCLUDED_RELEASES_ENABLED,
  ReferenceInput,
  ReferenceInputOptionsProvider,
  ReferenceInputPreviewCard,
  RelativeTime,
  ReleaseAvatar,
  RELEASES_INTENT,
  RELEASES_STUDIO_CLIENT_OPTIONS,
  remoteSnapshots,
  removeDupes,
  removeMissingReferences,
  removeUndefinedLocaleResources,
  renderStudio,
  Resizable,
  resizeObserver,
  resolveConditionalProperty,
  resolveConfig,
  resolveDiffComponent,
  resolveInitialObjectValue,
  resolveInitialValue,
  resolveInitialValueForType,
  resolveSchemaTypes,
  ResourceCacheProvider,
  RevertChangesButton,
  SANITY_PATCH_TYPE,
  SANITY_VERSION,
  SanityDefaultPreview,
  ScheduledBadge,
  SchemaError,
  ScrollContainer,
  SearchButton,
  SearchDialog,
  SearchHeader,
  SearchPopover,
  SearchProvider,
  SearchResultItemPreview,
  searchStrategies,
  SelectInput,
  selectUpstreamVersion,
  serializeError,
  SESSION_ID,
  set,
  setAtPath,
  setIfMissing,
  sliceString,
  SlugInput,
  snapshotPair,
  SourceProvider,
  StatusButton,
  StringInput,
  stringToPath,
  Studio,
  StudioAnnouncementsCard,
  StudioAnnouncementsDialog,
  StudioLayout,
  StudioLayoutComponent,
  StudioLogo,
  StudioNavbar,
  StudioProvider,
  StudioToolMenu,
  supportsTouch,
  systemBundles,
  TagsArrayInput,
  type TargetPerspective,
  TelephoneInput,
  TemplatePreview,
  TextInput,
  TextWithTone,
  Timeline,
  TIMELINE_ITEM_I18N_KEY_MAPPING,
  TimelineController,
  toMutationPatches,
  ToolLink,
  TooltipOfDisabled,
  TransformPatches,
  Translate,
  truncateString,
  typed,
  uncaughtErrorHandler,
  UniversalArrayInput,
  unset,
  unstable_useObserveDocument,
  unstable_useValuePreview,
  UpsellDescriptionSerializer,
  UpsellDialogDismissed,
  UpsellDialogLearnMoreCtaClicked,
  UpsellDialogUpgradeCtaClicked,
  UpsellDialogViewed,
  UrlInput,
  useActiveReleases,
  useActiveWorkspace,
  useAddonDataset,
  useAnnotationColor,
  useArchivedReleases,
  useChangeIndicatorsReportedValues,
  useChangeIndicatorsReporter,
  useClient,
  useColorScheme,
  useColorSchemeInternalValue,
  useColorSchemeOptions,
  useColorSchemeSetValue,
  useColorSchemeValue,
  useComments,
  useCommentsEnabled,
  useCommentsSelectedPath,
  useCommentsTelemetry,
  useConfigContextFromSource,
  useConnectionState,
  useConnectionStatusStore,
  useCopyErrorDetails,
  useCopyPaste,
  useCurrentLocale,
  useCurrentUser,
  useDataset,
  useDateTimeFormat,
  useDidUpdate,
  useDiffAnnotationColor,
  useDocumentChange,
  useDocumentForm,
  useDocumentIdStack,
  useDocumentLimitsUpsellContext,
  useDocumentOperation,
  useDocumentOperationEvent,
  useDocumentPairPermissions,
  useDocumentPairPermissionsFromHookFactory,
  useDocumentPresence,
  useDocumentPreviewStore,
  useDocumentStore,
  useDocumentType,
  useDocumentValuePermissions,
  useDocumentValues,
  useDocumentVersionInfo,
  useDocumentVersions,
  useDocumentVersionTypeSortedList,
  useEditState,
  useEvents,
  useEventsStore,
  useExcludedPerspective,
  useFeatureEnabled,
  useFieldActions,
  useFilteredReleases,
  useFormattedDuration,
  useFormBuilder,
  useFormCallbacks,
  useFormState,
  useFormValue,
  useGetFormValue,
  useGetI18nText,
  useGlobalCopyPasteElementHandler,
  useGlobalPresence,
  useGrantsStore,
  useHistoryStore,
  useHoveredField,
  useI18nText,
  useInitialValue,
  useInitialValueResolverContext,
  useIsReleaseActive,
  useKeyValueStore,
  useListFormat,
  useLoadable,
  useLocale,
  useMiddlewareComponents,
  usEnglishLocale,
  useNumberFormat,
  useOnlyHasVersions,
  useOnScroll,
  usePerspective,
  usePresenceStore,
  usePreviewCard,
  useProject,
  useProjectDatasets,
  useProjectId,
  useProjectStore,
  UserAvatar,
  UserColorManagerProvider,
  useReferenceInputOptions,
  useReferringDocuments,
  useRelativeTime,
  useReleasesIds,
  useRenderingContextStore,
  useResolveInitialValueForType,
  useResourceCache,
  useReviewChanges,
  userHasRole,
  useRovingFocus,
  useSanityCreateConfig,
  useSchema,
  useSearchMaxFieldDepth,
  useSearchState,
  useSetPerspective,
  useSource,
  useStudioUrl,
  useSyncState,
  useTemplatePermissions,
  useTemplatePermissionsFromHookFactory,
  useTemplates,
  useThrottledCallback,
  useTimeAgo,
  useTimelineSelector,
  useTimelineStore,
  useTools,
  useTrackerStore,
  useTrackerStoreReporter,
  useTranslation,
  useTreeEditingEnabled,
  useUnique,
  useUnitFormatter,
  useUser,
  useUserColor,
  useUserColorManager,
  useUserListWithPermissions,
  useUserStore,
  useValidationStatus,
  useVersionOperations,
  useVirtualizerScrollInstance,
  useWorkspace,
  useWorkspaceLoader,
  useWorkspaces,
  useWorkspaceSchemaId,
  useZIndex,
  validateBasePaths,
  validateDocument,
  validateNames,
  validateWorkspaces,
  validation,
  ValueError,
  VERSION_FOLDER,
  VersionChip,
  VersionInlineBadge,
  VirtualizerScrollInstanceProvider,
  visitDiff,
  WithReferringDocuments,
  WorkspaceLoader,
  WorkspaceProvider,
  WorkspacesProvider,
  ZIndexProvider,
}

export type {
  ArraySchemaType,
  Asset,
  BooleanSchemaType,
  ConfigContext,
  CrossDatasetReferenceSchemaType,
  DocumentActionGroup,
  DocumentActionProps,
  DocumentFieldAction,
  DocumentFieldActionGroup,
  DocumentFieldActionItem,
  DocumentFieldActionNode,
  DocumentFieldActionProps,
  DocumentInspector,
  DocumentInspectorMenuItem,
  DocumentInspectorProps,
  DocumentPresence,
  DocumentPreviewStore,
  DocumentStore,
  DocumentValuePermission,
  EditStateFor,
  FileSchemaType,
  GeneralPreviewLayoutKey,
  GlobalDocumentReferenceSchemaType,
  I18nTextRecord,
  InitialValueTemplateItem,
  LocaleSource,
  NumberSchemaType,
  ObjectSchemaType,
  PatchMsg,
  PerspectiveNotWriteableReason,
  PerspectiveStack,
  PreviewableType,
  PublishDocumentVersionEvent,
  PublishedId,
  ReferenceInputOptions,
  ReferenceSchemaType,
  ReleaseDocument,
  SanityDocument,
  SanityDocumentLike,
  SearchStrategy,
  SelectedPerspective,
  SpanSchemaType,
  StringSchemaType,
  TemplatePermissionsResult,
  TimelineStore,
  UseDateTimeFormatOptions,
  Workspace,
}

export {
  CapabilityGate,
  catchWithCount,
  isPerspectiveWriteable,
  ReleasesNav,
  SanityClient,
  useCanvasCompanionDoc,
  useConditionalToast,
  useManageFavorite,
  useNavigateToCanvasDoc,
  useReconnectingToast,
}

export type {
  AnnotationDetails,
  AvailabilityResponse,
  BlockDefinition,
  Chunk,
  ChunkType,
  CommandListItemContext,
  CommandListRenderItemCallback,
  CommentIntentGetter,
  Config,
  CreateLinkMetadata,
  Diff,
  DocumentActionComponent,
  DocumentActionConfirmDialogProps,
  DocumentActionDescription,
  DocumentActionDialogProps,
  DocumentActionModalDialogProps,
  DocumentActionPopoverDialogProps,
  DocumentActionsContext,
  DocumentActionsVersionType,
  DocumentAvailability,
  DocumentBadgeComponent,
  DocumentBadgeDescription,
  DocumentBadgeProps,
  DocumentChangeContextInstance,
  DocumentFormNode,
  DocumentGroupEvent,
  DocumentInspectorUseMenuItemProps,
  DocumentLanguageFilterComponent,
  DocumentLayoutProps,
  DocumentMutationEvent,
  DocumentRebaseEvent,
  DuplicateDocumentActionComponent,
  FIXME,
  FormDocumentValue,
  FormNodeValidation,
  GeneralDocumentListLayoutKey,
  InputProps,
  KeyValueStoreValue,
  LocaleResourceBundle,
  MediaLibraryConfig,
  MultiFieldSet,
  ObjectDiff,
  ObjectField,
  PartialContext,
  Path,
  PermissionCheckResult,
  PerspectiveContextValue,
  PluginOptions,
  PreviewLayoutKey,
  PreviewValue,
  QueryParams,
  RelativeTimeOptions,
  ReleaseId,
  ReleasesNavMenuItemPropsGetter,
  Role,
  Rule,
  RuleSpec,
  Schema,
  SchemaType,
  SchemaValidationValue,
  SearchOptions,
  SearchSort,
  Source,
  SourceClientOptions,
  StateTree,
  StudioLocaleResourceKeys,
  Template,
  TFunction,
  Tool,
  UseManageFavoriteProps,
  WorkspaceOptions,
}
