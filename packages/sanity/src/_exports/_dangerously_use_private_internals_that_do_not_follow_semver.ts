/**
 * Private internals of `sanity` that do not follow semver.
 *
 * Everything exported from this entry is an implementation detail of Sanity Studio. It is
 * exported because the Studio's own tools and plugins (structure, presentation, vision, …) need
 * it, not because it is meant to be used by studios or third-party plugins. Every export can
 * change or disappear in any release, including patch releases, without notice, without a
 * deprecation period and without being mentioned in the changelog.
 *
 * If you import from this entry anyway: pin an exact `sanity` version, expect breakage on every
 * upgrade, and know that there is no support for it.
 *
 * Everything here carries the internal TSDoc release tag. The public `sanity`,
 * `sanity/structure`, `sanity/router` and `sanity/presentation` entries must not export
 * internal symbols (enforced by the `internal-exports` test in the `test-dts-exports` workspace).
 */

export {type FIXME} from '../core/FIXME'
export {useCanvasCompanionDoc} from '../core/canvas/actions/useCanvasCompanionDoc'
export {useNavigateToCanvasDoc} from '../core/canvas/useNavigateToCanvasDoc'
export {getDocumentIdForCanvasLink} from '../core/canvas/utils/getDocumentIdForCanvasLink'
export {ChangeFieldWrapper} from '../core/changeIndicators/ChangeFieldWrapper'
export {type ChangeIndicatorProps} from '../core/changeIndicators/ChangeIndicator'
export {type ConnectorContextValue} from '../core/changeIndicators/ConnectorContext'
export {
  ChangeConnectorRoot,
  type ChangeConnectorRootProps,
} from '../core/changeIndicators/overlay/ChangeConnectorRoot'
export {
  ChangeIndicatorsTracker,
  useChangeIndicatorsReportedValues,
  useChangeIndicatorsReporter,
} from '../core/changeIndicators/tracker'
export {
  type ChangeIndicatorTrackerContextValue,
  type TrackedArea,
  type TrackedChange,
} from '../core/changeIndicators/types'
export {CommentDeleteDialog} from '../core/comments/components/CommentDeleteDialog'
export {CommentDisabledIcon} from '../core/comments/components/icons/CommentDisabledIcon'
export {CommentsList} from '../core/comments/components/list/CommentsList'
export {CommentInlineHighlightSpan} from '../core/comments/components/pte/CommentInlineHighlightSpan'
export {
  CommentInput,
  type CommentInputHandle,
  type CommentInputProps,
} from '../core/comments/components/pte/comment-input/CommentInput'
export {COMMENTS_INSPECTOR_NAME} from '../core/comments/constants'
export {CommentsAuthoringPathProvider} from '../core/comments/context/authoring-path/CommentsAuthoringPathProvider'
export {CommentsProvider} from '../core/comments/context/comments/CommentsProvider'
export {CommentsEnabledProvider} from '../core/comments/context/enabled/CommentsEnabledProvider'
export {CommentsIntentProvider} from '../core/comments/context/intent/CommentsIntentProvider'
export {CommentsSelectedPathProvider} from '../core/comments/context/selected-path/CommentsSelectedPathProvider'
export {type CommentsSelectedPath} from '../core/comments/context/selected-path/types'
export {hasCommentMessageValue, isTextSelectionComment} from '../core/comments/helpers'
export {useComments} from '../core/comments/hooks/useComments'
export {useCommentsEnabled} from '../core/comments/hooks/useCommentsEnabled'
export {useCommentsSelectedPath} from '../core/comments/hooks/useCommentsSelectedPath'
export {useCommentsTelemetry} from '../core/comments/hooks/useCommentsTelemetry'
export {buildCommentRangeDecorations} from '../core/comments/utils/inline-comments/buildCommentRangeDecorations'
export {buildRangeDecorationSelectionsFromComments} from '../core/comments/utils/inline-comments/buildRangeDecorationSelectionsFromComments'
export {buildTextSelectionFromFragment} from '../core/comments/utils/inline-comments/buildTextSelectionFromFragment'
export {CommentsProvider as CommentsProviderV2} from '../core/comments-v2/context/comments/CommentsProvider'
export {CommentsEnabledProvider as CommentsEnabledProviderV2} from '../core/comments-v2/context/enabled/CommentsEnabledProvider'
export {useCommentsEnabled as useCommentsEnabledV2} from '../core/comments-v2/hooks/useCommentsEnabled'
export {BetaBadge, type BetaBadgeProps} from '../core/components/BetaBadge'
export {CapabilityGate} from '../core/components/CapabilityGate'
export {Delay} from '../core/components/Delay'
export {Hotkeys} from '../core/components/Hotkeys'
export {type InsufficientPermissionsMessageProps} from '../core/components/InsufficientPermissionsMessage'
export {RelativeTime, type RelativeTimeProps} from '../core/components/RelativeTime'
export {TooltipOfDisabled} from '../core/components/TooltipOfDisabled'
export {
  AutoCollapseMenu,
  CollapseMenu,
  type CollapseMenuProps,
} from '../core/components/collapseMenu/CollapseMenu'
export {
  CollapseMenuButton,
  type CollapseMenuButtonProps,
  type CommonProps,
} from '../core/components/collapseMenu/CollapseMenuButton'
export {CommandList} from '../core/components/commandList/CommandList'
export {
  type CommandListElementType,
  type CommandListGetItemDisabledCallback,
  type CommandListGetItemKeyCallback,
  type CommandListGetItemSelectedCallback,
  type CommandListHandle,
  type CommandListItemContext,
  type CommandListProps,
  type CommandListRenderItemCallback,
} from '../core/components/commandList/types'
export {ContextMenuButton} from '../core/components/contextMenuButton/ContextMenuButton'
export {DocumentVersionIcons} from '../core/components/documentStatus/DocumentVersionIcons'
export {DocumentVersionsStatus} from '../core/components/documentStatus/DocumentVersionsStatus'
export {DocumentVersionsStatusIndicator} from '../core/components/documentStatusIndicator/DocumentVersionsStatusIndicator'
export {ErrorActions, type ErrorActionsProps} from '../core/components/errorActions/ErrorActions'
export {type ErrorWithId} from '../core/components/errorActions/types'
export {
  serializeError,
  useCopyErrorDetails,
} from '../core/components/errorActions/useCopyErrorDetails'
export {GetHookCollectionState} from '../core/components/hookCollection/GetHookCollectionState'
export {LoadingBlock} from '../core/components/loadingBlock/LoadingBlock'
export {PopoverDialog} from '../core/components/popoverDialog/PopoverDialog'
export {
  type PreviewCardContextValue,
  ReferenceInputPreviewCard,
  usePreviewCard,
} from '../core/components/previewCard/PreviewCard'
export {CompactPreview} from '../core/components/previews/general/CompactPreview'
export {DetailPreview} from '../core/components/previews/general/DetailPreview'
export {MediaPreview} from '../core/components/previews/general/MediaPreview'
export {BlockImagePreview} from '../core/components/previews/portableText/BlockImagePreview'
export {BlockPreview} from '../core/components/previews/portableText/BlockPreview'
export {InlinePreview} from '../core/components/previews/portableText/InlinePreview'
export {TemplatePreview} from '../core/components/previews/template/TemplatePreview'
export {CircularProgress} from '../core/components/progress/CircularProgress'
export {
  type TrackerContextGetSnapshot,
  type TrackerContextStore,
  useTrackerStore,
  useTrackerStoreReporter,
} from '../core/components/react-track-elements/hooks'
export {
  type IsEqualFunction,
  type Reported,
  type ReporterHook,
} from '../core/components/react-track-elements/types'
export {Resizable} from '../core/components/resizer/Resizable'
export {useRovingFocus} from '../core/components/rovingFocus/useRovingFocus'
export {useOnScroll} from '../core/components/scroll/hooks'
export {ScrollContainer, type ScrollContainerProps} from '../core/components/scroll/scrollContainer'
export {type ScrollContextValue, type ScrollEventHandler} from '../core/components/scroll/types'
export {type TextWithToneProps} from '../core/components/textWithTone/TextWithTone'
// oxlint-disable-next-line no-deprecated -- deprecated API stays available on the internals entry until it is removed
export {ImperativeToast, type ToastParams} from '../core/components/transitional/ImperativeToast'
export {
  LegacyLayerProvider,
  type ZIndexContextValueKey,
} from '../core/components/transitional/LegacyLayerProvider'
export {AvatarSkeleton} from '../core/components/userAvatar/UserAvatar'
export {ZIndexProvider} from '../core/components/zOffsets/ZIndexProvider'
export {type ZIndexContextValue} from '../core/components/zOffsets/types'
export {useZIndex} from '../core/components/zOffsets/useZIndex'
export {
  ConfigPropertyError,
  type ConfigPropertyErrorOptions,
} from '../core/config/ConfigPropertyError'
export {
  ConfigResolutionError,
  type ConfigResolutionErrorOptions,
} from '../core/config/ConfigResolutionError'
export {SchemaError} from '../core/config/SchemaError'
export {type CookielessCompatibleLoginMethod} from '../core/config/auth/types'
export {useMiddlewareComponents} from '../core/config/components/useMiddlewareComponents'
export {createDefaultIcon} from '../core/config/createDefaultIcon'
export {isSanityDefinedAction} from '../core/config/document/actions'
export {initialDocumentFieldActions} from '../core/config/document/fieldActions'
export {documentFieldActionsReducer} from '../core/config/document/fieldActions/reducer'
export {getDocumentVersionType} from '../core/config/document/useConfiguredDocumentActionIds'
export {flattenConfig} from '../core/config/flattenConfig'
export {prepareConfig} from '../core/config/prepareConfig'
export {
  createSourceFromConfig,
  createWorkspaceFromConfig,
  type CreateWorkspaceFromConfigOptions,
  resolveConfig,
} from '../core/config/resolveConfig'
export {resolveSchemaTypes} from '../core/config/resolveSchemaTypes'
export {type NavbarAction} from '../core/config/studio/types'
export {
  type AsyncConfigPropertyReducer,
  type BetaFeatures,
  type ConfigPropertyReducer,
  type DocumentLayoutProps,
  type FormBuilderComponentResolverContext,
  type PreparedConfig,
  type WorkspaceSummary,
} from '../core/config/types'
export {
  getConfigContextFromSource,
  useConfigContextFromSource,
} from '../core/config/useConfigContextFromSource'
export {useDivergenceNavigator} from '../core/divergence/divergenceNavigator'
export {
  DocumentGroupInventory,
  type DocumentGroupInventoryProps,
} from '../core/documentGroupInventory/components/DocumentGroupInventory'
export {DocumentGroupInventoryAction} from '../core/documentGroupInventory/components/DocumentGroupInventoryAction'
export {
  type DocumentGroupInventoryComponents,
  type DocumentGroupInventoryPerspectiveList,
  type DocumentGroupInventoryReferencePreviewLinkProps,
} from '../core/documentGroupInventory/types'
export {isProd} from '../core/environment'
export {FeedbackDialog, type FeedbackDialogProps} from '../core/feedback/components/FeedbackDialog'
export {
  StudioFeedbackDialog,
  type StudioFeedbackDialogProps,
} from '../core/feedback/components/StudioFeedbackDialog'
export {
  FeedbackContext,
  useFeedback,
  type UseFeedbackReturn,
} from '../core/feedback/hooks/useFeedback'
export {
  useInStudioFeedback,
  type UseInStudioFeedbackReturn,
} from '../core/feedback/hooks/useInStudioFeedback'
export {useStudioFeedbackTags} from '../core/feedback/hooks/useStudioFeedbackTags'
export {type FeedbackContextValue, type Sentiment} from '../core/feedback/types'
export {
  type DiffVisitor,
  getAnnotationAtPath,
  getAnnotationColor,
  visitDiff,
} from '../core/field/diff/annotations/helpers'
export {ChangeBreadcrumb} from '../core/field/diff/components/ChangeBreadcrumb'
export {type ChangeListProps} from '../core/field/diff/components/ChangeList'
export {
  ChangeResolver,
  type ChangeResolverProps,
  GroupChange,
} from '../core/field/diff/components/ChangeResolver'
export {ChangeTitleSegment} from '../core/field/diff/components/ChangeTitleSegment'
export {ChangesError} from '../core/field/diff/components/ChangesError'
export {type DiffCardProps} from '../core/field/diff/components/DiffCard'
export {
  DiffErrorBoundary,
  type DiffErrorBoundaryProps,
  type DiffErrorBoundaryState,
} from '../core/field/diff/components/DiffErrorBoundary'
export {type DiffFromToProps} from '../core/field/diff/components/DiffFromTo'
export {
  DiffInspectWrapper,
  type DiffInspectWrapperProps,
} from '../core/field/diff/components/DiffInspectWrapper'
export {DiffString, DiffStringSegment} from '../core/field/diff/components/DiffString'
export {
  type DiffTooltipProps,
  type DiffTooltipWithAnnotationsProps,
} from '../core/field/diff/components/DiffTooltip'
export {Event} from '../core/field/diff/components/Event'
export {FallbackDiff} from '../core/field/diff/components/FallbackDiff'
export {FieldChange} from '../core/field/diff/components/FieldChange'
export {FromTo, type FromToProps} from '../core/field/diff/components/FromTo'
export {FromToArrow, type FromToArrowDirection} from '../core/field/diff/components/FromToArrow'
export {MetaInfo, type MetaInfoProps} from '../core/field/diff/components/MetaInfo'
export {NoChanges} from '../core/field/diff/components/NoChanges'
export {RevertChangesButton} from '../core/field/diff/components/RevertChangesButton'
export {RevertChangesConfirmDialog} from '../core/field/diff/components/RevertChangesConfirmDialog'
export {ValueError} from '../core/field/diff/components/ValueError'
export {TIMELINE_ITEM_I18N_KEY_MAPPING} from '../core/field/diff/components/constants'
export {type DocumentChangeContextInstance} from '../core/field/diff/contexts/DocumentChangeContext'
export {
  emptyValuesByType,
  isAddedItemDiff,
  isFieldChange,
  isGroupChange,
  isRemovedItemDiff,
  isUnchangedDiff,
  noop,
} from '../core/field/diff/helpers'
export {useDocumentChange} from '../core/field/diff/hooks/useDocumentChange'
export {resolveDiffComponent} from '../core/field/diff/resolve/resolveDiffComponent'
export {
  findIndex,
  getItemKey,
  getItemKeySegment,
  getValueAtPath,
  isEmptyObject,
  normalizeIndexSegment,
  normalizeIndexTupleSegment,
  normalizeKeySegment,
  normalizePathSegment,
} from '../core/field/paths/helpers'
export {type FieldPreviewComponent} from '../core/field/preview/types'
export {
  type ArrayDiff,
  type ArrayItemMetadata,
  type BooleanDiff,
  type ChangeNode,
  type ChangeTitlePath,
  type Diff,
  type DiffComponentOptions,
  type DiffComponentResolver,
  type FieldChangeNode,
  type FieldOperationsAPI,
  type FromToIndex,
  type GroupChangeNode,
  type ItemDiff,
  type NullDiff,
  type NumberDiff,
  type ReferenceDiff,
  type StringDiff,
  type StringDiffSegment,
  type StringSegmentChanged,
  type StringSegmentUnchanged,
  type TypeChangeDiff,
} from '../core/field/types'
export {type FieldValueError, getValueError} from '../core/field/validation'
export {EditPortal} from '../core/form/components/EditPortal'
export {EnhancedObjectDialog} from '../core/form/components/EnhancedObjectDialog'
export {
  type FormInputAbsolutePathArg,
  type FormInputRelativePathArg,
} from '../core/form/components/FormInput'
export {type FormFieldProps} from '../core/form/components/formField/FormField'
export {type FormFieldHeaderTextProps} from '../core/form/components/formField/FormFieldHeaderText'
export {FormFieldSet, type FormFieldSetProps} from '../core/form/components/formField/FormFieldSet'
export {
  type FieldStatusProps,
  FormFieldStatus,
} from '../core/form/components/formField/FormFieldStatus'
export {type FormFieldValidationStatusProps} from '../core/form/components/formField/FormFieldValidationStatus'
export {
  type FormFieldValidation,
  type FormFieldValidationError,
  type FormFieldValidationInfo,
  type FormFieldValidationWarning,
} from '../core/form/components/formField/types'
export {FormCell} from '../core/form/components/layout/FormCell'
export {FormContainer} from '../core/form/components/layout/FormContainer'
export {FormRow} from '../core/form/components/layout/FormRow'
export {
  DivergencesProvider,
  useDocumentDivergences,
} from '../core/form/contexts/DivergencesProvider'
export {type FormValueContextValue, FormValueProvider} from '../core/form/contexts/FormValue'
export {GetFormValueProvider} from '../core/form/contexts/GetFormValue'
export {HoveredFieldProvider} from '../core/form/field/HoveredFieldProvider'
export {
  FieldActionMenu,
  type FieldActionMenuProps,
} from '../core/form/field/actions/FieldActionMenu'
export {FieldActionsProvider} from '../core/form/field/actions/FieldActionsProvider'
export {
  type FieldActionsProps,
  FieldActionsResolver,
} from '../core/form/field/actions/FieldActionsResolver'
export {useFieldActions} from '../core/form/field/actions/useFieldActions'
export {useHoveredField} from '../core/form/field/useHoveredField'
export {useDidUpdate} from '../core/form/hooks/useDidUpdate'
export {BooleanInput} from '../core/form/inputs/BooleanInput'
export {CrossDatasetReferencePreview} from '../core/form/inputs/CrossDatasetReferenceInput/CrossDatasetReferencePreview'
export {DateInput} from '../core/form/inputs/DateInputs/DateInput'
export {DateTimeInput} from '../core/form/inputs/DateInputs/DateTimeInput'
export {getCalendarLabels} from '../core/form/inputs/DateInputs/utils'
export {EmailInput} from '../core/form/inputs/EmailInput'
export {NumberInput} from '../core/form/inputs/NumberInput/NumberInput'
export {ObjectInput} from '../core/form/inputs/ObjectInput/ObjectInput'
export {
  type PortableTextMemberItem,
  UpdateReadOnlyPlugin,
} from '../core/form/inputs/PortableText/PortableTextInput'
export {CreateButton as CreateReferenceButton} from '../core/form/inputs/ReferenceInput/CreateButton'
export {ReferenceAutocomplete} from '../core/form/inputs/ReferenceInput/ReferenceAutocomplete'
export {type CreateReferenceOption} from '../core/form/inputs/ReferenceInput/types'
export {SelectInput} from '../core/form/inputs/SelectInput'
export {SlugInput} from '../core/form/inputs/Slug/SlugInput'
export {StringInput} from '../core/form/inputs/StringInput/StringInput'
export {TagsArrayInput} from '../core/form/inputs/TagsArrayInput'
export {TelephoneInput} from '../core/form/inputs/TelephoneInput'
export {UrlInput} from '../core/form/inputs/UrlInput'
export {ArrayOfObjectsInput} from '../core/form/inputs/arrays/ArrayOfObjectsInput/ArrayOfObjectsInput'
export {
  useVirtualizerScrollInstance,
  type VirtualizerScrollInstance,
} from '../core/form/inputs/arrays/ArrayOfObjectsInput/List/useVirtualizerScrollInstance'
export {ArrayOfObjectOptionsInput} from '../core/form/inputs/arrays/ArrayOfOptionsInput/ArrayOfObjectOptionsInput'
export {ArrayOfOptionsInput} from '../core/form/inputs/arrays/ArrayOfOptionsInput/ArrayOfOptionsInput'
export {ArrayOfPrimitiveOptionsInput} from '../core/form/inputs/arrays/ArrayOfOptionsInput/ArrayOfPrimitiveOptionsInput'
export {ArrayOfPrimitivesFunctions} from '../core/form/inputs/arrays/ArrayOfPrimitivesInput/ArrayOfPrimitivesFunctions'
export {ArrayOfPrimitivesInput} from '../core/form/inputs/arrays/ArrayOfPrimitivesInput/ArrayOfPrimitivesInput'
export {UniversalArrayInput} from '../core/form/inputs/arrays/UniversalArrayInput'
export {
  ArrayOfObjectsInputMember,
  type ArrayOfObjectsMemberProps,
} from '../core/form/members/array/ArrayOfObjectsInputMember'
export {
  ArrayOfObjectsInputMembers,
  type ArrayOfObjectsInputMembersProps,
} from '../core/form/members/array/ArrayOfObjectsInputMembers'
export {ArrayOfPrimitivesItem} from '../core/form/members/array/items/ArrayOfPrimitivesItem'
export {type MemberFieldProps} from '../core/form/members/object/MemberField'
export {MemberFieldSet} from '../core/form/members/object/MemberFieldset'
export {type ObjectInputMemberProps} from '../core/form/members/object/ObjectInputMember'
export {
  ObjectInputMembers,
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  ObjectMembers,
  type ObjectMembersProps,
} from '../core/form/members/object/ObjectInputMembers'
export {prefixPath, SANITY_PATCH_TYPE} from '../core/form/patch/patch'
export {resolveConditionalProperty} from '../core/form/store/conditional-property/resolveConditionalProperty'
export {setAtPath} from '../core/form/store/stateTreeHelper'
export {type DocumentFormNode, type HiddenField} from '../core/form/store/types/nodes'
export {
  type FormState,
  useFormState,
  type UseFormStateOptions,
} from '../core/form/store/useFormState'
export {
  type ExpandFieldSetOperation,
  type ExpandOperation,
  type ExpandPathOperation,
  getExpandOperations,
  type SetActiveGroupOperation,
} from '../core/form/store/utils/getExpandOperations'
export {mergeParseErrors, type ParseError} from '../core/form/store/utils/mergeParseErrors'
export {FormProvider} from '../core/form/studio/FormProvider'
export {
  createSanityMediaLibraryFileSource,
  createSanityMediaLibraryImageSource,
} from '../core/form/studio/assetSourceMediaLibrary/createAssetSource'
export {type FormCallbacksValue} from '../core/form/studio/contexts/FormCallbacks'
export {
  ParseErrorsProvider,
  useParseErrorForPath,
  useParseErrors,
  useReportParseError,
} from '../core/form/studio/contexts/ParseErrors'
export {
  type EditReferenceLinkComponentProps,
  type EditReferenceOptions,
  type ReferenceInputOptions,
  ReferenceInputOptionsProvider,
  type TemplateOption,
  useReferenceInputOptions,
} from '../core/form/studio/contexts/ReferenceInputOptions'
export {
  defaultRenderAnnotation,
  defaultRenderBlock,
  defaultRenderField,
  defaultRenderInlineBlock,
  defaultRenderInput,
  defaultRenderItem,
  defaultRenderPreview,
} from '../core/form/studio/defaults'
export {StudioFileInput as FileInput} from '../core/form/studio/inputs/StudioFileInput'
export {StudioImageInput as ImageInput} from '../core/form/studio/inputs/StudioImageInput'
export {StudioCrossDatasetReferenceInput as CrossDatasetReferenceInput} from '../core/form/studio/inputs/crossDatasetReference/StudioCrossDatasetReferenceInput'
export {StudioReferenceInput as ReferenceInput} from '../core/form/studio/inputs/reference/StudioReferenceInput'
// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
export {useEnhancedObjectDialog} from '../core/form/studio/tree-editing/context/enabled/useEnhancedObjectDialog'
export {type UploaderDef} from '../core/form/studio/uploads/types'
export {type FormBuilderFilterFieldFn} from '../core/form/types/_transitional'
export {
  isArrayOfBlocksInputProps,
  isArrayOfPrimitivesInputProps,
  isBooleanInputProps,
  isNumberInputProps,
  isObjectItemProps,
} from '../core/form/types/asserters'
// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
export {type FieldCommentsProps, type PrimitiveFieldProps} from '../core/form/types/fieldProps'
export {useDocumentForm} from '../core/form/useDocumentForm'
export {useFormBuilder} from '../core/form/useFormBuilder'
export {TransformPatches} from '../core/form/utils/TransformPatches'
export {type MutationPatch, toMutationPatches} from '../core/form/utils/mutationPatch'
export {decodePath, encodePath} from '../core/form/utils/path'
export {useConditionalToast} from '../core/hooks/useConditionalToast'
export {
  connectionState,
  type ConnectionState,
  useConnectionState,
} from '../core/hooks/useConnectionState'
export {useDateTimeFormat} from '../core/hooks/useDateTimeFormat'
export {useDialogStack} from '../core/hooks/useDialogStack'
export {type DocumentIdStack, useDocumentIdStack} from '../core/hooks/useDocumentIdStack'
export {useDocumentOperationEvent} from '../core/hooks/useDocumentOperationEvent'
export {
  deriveDocumentSyncState,
  type DocumentSyncState,
  useDocumentSyncState,
} from '../core/hooks/useDocumentSyncState'
export {useDocumentVersionTitle} from '../core/hooks/useDocumentVersionTitle'
export {useFeatureEnabled} from '../core/hooks/useFeatureEnabled'
export {useFilteredReleases} from '../core/hooks/useFilteredReleases'
export {
  type GlobalCopyPasteElementHandler,
  useGlobalCopyPasteElementHandler,
} from '../core/hooks/useGlobalCopyPasteElementHandler'
export {useManageFavorite, type UseManageFavoriteProps} from '../core/hooks/useManageFavorite'
export {useNumberFormat} from '../core/hooks/useNumberFormat'
export {useReconnectingToast} from '../core/hooks/useReconnectingToast'
export {useReferringDocuments} from '../core/hooks/useReferringDocuments'
export {type RelativeTimeOptions} from '../core/hooks/useRelativeTime'
export {useReviewChanges} from '../core/hooks/useReviewChanges'
export {useStudioUrl} from '../core/hooks/useStudioUrl'
export {type SyncState} from '../core/hooks/useSyncState'
export {
  type CreatableTargetDocument,
  getCreatableVariantTarget,
  getPairTarget,
  getTargetScopeId,
  getTargetSiblings,
  type TargetDocumentState,
  useTargetDocumentState,
} from '../core/hooks/useTargetDocumentState'
export {type TargetScopeIdOptions, useTargetScopeId} from '../core/hooks/useTargetScopeId'
export {type TimeAgoOpts} from '../core/hooks/useTimeAgo'
export {useUnitFormatter} from '../core/hooks/useUnitFormatter'
export {useUserListWithPermissions} from '../core/hooks/useUserListWithPermissions'
export {useVersionRelease} from '../core/hooks/useVersionRelease'
export {LocaleProvider, LocaleProviderBase} from '../core/i18n/components/LocaleProvider'
// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
export {defineLocalesResources, removeUndefinedLocaleResources} from '../core/i18n/helpers'
export {useGetI18nText} from '../core/i18n/hooks/useGetI18nText'
export {type I18nNode, useI18nText} from '../core/i18n/hooks/useI18nText'
export {useCurrentLocale, useLocale} from '../core/i18n/hooks/useLocale'
export {defaultLocale, usEnglishLocale} from '../core/i18n/locales'
export {useDocumentLimitsUpsellContext} from '../core/limits/context/documents/DocumentLimitUpsellProvider'
export {isDocumentLimitError} from '../core/limits/context/documents/isDocumentLimitError'
export {getSelectedVariant} from '../core/perspective/getSelectedVariant'
export {
  isPerspectiveWriteable,
  type PerspectiveNotWriteableReason,
} from '../core/perspective/isPerspectiveWriteable'
export {ReleasesNav} from '../core/perspective/navbar/ReleasesNav'
export {type ReleasesNavMenuItemPropsGetter} from '../core/perspective/types'
export {useExcludedPerspective} from '../core/perspective/useExcludedPerspective'
export {useGetDefaultPerspective} from '../core/perspective/useGetDefaultPerspective'
export {useSetPerspective} from '../core/perspective/useSetPerspective'
export {useSetVariant} from '../core/perspective/useSetVariant'
export {type DocumentPreviewPresenceProps} from '../core/presence/DocumentPreviewPresence'
export {
  FieldPresence,
  FieldPresenceInner,
  type FieldPresenceInnerProps,
  type FieldPresenceProps,
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  FieldPresenceWithOverlay,
} from '../core/presence/FieldPresence'
export {PresenceScope, type PresenceScopeProps} from '../core/presence/PresenceScope'
export {type PresenceOverlayProps} from '../core/presence/overlay/PresenceOverlay'
export {
  type FieldPresenceData,
  type Location,
  type Position,
  type PresentUser,
  type Rect,
  type RegionWithIntersectionDetails,
  type ReportedRegionWithRect,
  type Size,
} from '../core/presence/types'
export {PreviewLoader} from '../core/preview/components/PreviewLoader'
export {type SanityDefaultPreviewProps} from '../core/preview/components/SanityDefaultPreview'
export {
  createDocumentPreviewStore,
  type DocumentPreviewStoreOptions,
} from '../core/preview/documentPreviewStore'
export {
  type AvailabilityReason,
  type AvailabilityResponse,
  type Id,
  type ObserveDocumentTypeFromIdFn,
  type Selection,
} from '../core/preview/types'
export {
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  unstable_useObserveDocument,
  useUnstableObserveDocument,
} from '../core/preview/useObserveDocument'
// oxlint-disable-next-line no-deprecated -- deprecated API stays available on the internals entry until it is removed
export {unstable_useValuePreview, useValuePreview} from '../core/preview/useValuePreview'
export {getPreviewPaths} from '../core/preview/utils/getPreviewPaths'
export {prepareForPreview} from '../core/preview/utils/prepareForPreview'
export {Chip} from '../core/releases/components/Chip'
export {ReleaseAvatar, ReleaseAvatarIcon} from '../core/releases/components/ReleaseAvatar'
export {ReleaseTitle} from '../core/releases/components/ReleaseTitle'
export {
  getVersionInlineBadge,
  VersionInlineBadge,
} from '../core/releases/components/VersionInlineBadge'
export {VersionChip} from '../core/releases/components/documentHeader/VersionChip'
export {useDocumentVersionTypeSortedList} from '../core/releases/hooks/useDocumentVersionTypeSortedList'
export {useDocumentVersions} from '../core/releases/hooks/useDocumentVersions'
export {useFormatRelativeLocalePublishDate} from '../core/releases/hooks/useFormatRelativeLocalePublishDate'
export {useIsReleaseActive} from '../core/releases/hooks/useIsReleaseActive'
export {useOnlyHasVersions} from '../core/releases/hooks/useOnlyHasVersions'
export {useVersionOperations} from '../core/releases/hooks/useVersionOperations'
export {sortReleases} from '../core/releases/hooks/utils'
export {RELEASES_INTENT} from '../core/releases/plugin'
export {isReleaseDocument, type VersionInfoDocumentStub} from '../core/releases/store/types'
export {useActiveReleases} from '../core/releases/store/useActiveReleases'
export {useAllReleases} from '../core/releases/store/useAllReleases'
export {useArchivedReleases} from '../core/releases/store/useArchivedReleases'
export {useReleasesIds} from '../core/releases/store/useReleasesIds'
export {LATEST, PUBLISHED} from '../core/releases/util/const'
export {getReleaseDocumentIdFromReleaseId} from '../core/releases/util/getReleaseDocumentIdFromReleaseId'
export {getReleaseTone} from '../core/releases/util/getReleaseTone'
export {isGoingToUnpublish} from '../core/releases/util/isGoingToUnpublish'
export {
  isReleasePerspective,
  RELEASES_STUDIO_CLIENT_OPTIONS,
} from '../core/releases/util/releasesClient'
export {
  formatRelativeLocalePublishDate,
  getDocumentIsInPerspective,
  isDraftPerspective,
  isPublishedPerspective,
  isReleaseScheduledOrScheduling,
} from '../core/releases/util/util'
// oxlint-disable-next-line eslint/no-restricted-imports, no-deprecated -- deprecated scheduled-publishing API stays public until it is removed
export {EditScheduleForm} from '../core/scheduled-publishing/components/editScheduleForm/EditScheduleForm'
// oxlint-disable-next-line eslint/no-restricted-imports, no-deprecated -- deprecated scheduled-publishing API stays public until it is removed
export {SchedulesContext} from '../core/scheduled-publishing/tool/contexts/schedules'
export {getSchemaTypeTitle} from '../core/schema/helpers'
export {compileFieldPath} from '../core/search/common/compileFieldPath'
export {getSearchableTypes} from '../core/search/common/getSearchableTypes'
// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
export {isPerspectiveRaw} from '../core/search/common/isPerspectiveRaw'
export {
  type SearchFactoryOptions,
  type SearchOptions,
  type SearchSort,
  type SearchTerms,
} from '../core/search/common/types'
export {createSearch} from '../core/search/search'
export {
  defineSearchMachine,
  type SearchMachineContext,
  type SearchMachineEmitted,
  type SearchMachineEvent,
  type SearchMachineInput,
} from '../core/search/searchMachine'
export {
  type SearchMachineState,
  useSearchMachine,
  type UseSearchMachineOptions,
} from '../core/search/useSearchMachine'
export {
  SingleDocReleaseProvider,
  useSingleDocRelease,
} from '../core/singleDocRelease/context/SingleDocReleaseProvider'
export {usePausedScheduledDraft} from '../core/singleDocRelease/hooks/usePausedScheduledDraft'
export {useScheduledDraftDocument} from '../core/singleDocRelease/hooks/useScheduledDraftDocument'
export {useScheduledDraftsEnabled} from '../core/singleDocRelease/hooks/useScheduledDraftsEnabled'
export {
  type ResourceCache,
  ResourceCacheProvider,
  type ResourceCacheProviderProps,
  useResourceCache,
} from '../core/store/ResourceCacheProvider'
export {isAgentBundleName} from '../core/store/agent/createAgentBundlesStore'
export {
  type AgentVersionDisplay,
  useAgentVersionDisplay,
} from '../core/store/agent/useAgentVersionDisplay'
export {
  _createAuthStore,
  type AuthStoreOptions,
  createAuthStore,
  type CreateAuthStoreOptions,
  type RequestFailureDiagnostics,
} from '../core/store/authStore/createAuthStore'
export {
  createMockAuthStore,
  type MockAuthStoreOptions,
} from '../core/store/authStore/createMockAuthStore'
export {type HandleCallbackResult} from '../core/store/authStore/types'
export {
  isAuthStore,
  isCookielessCompatibleLoginMethod,
} from '../core/store/authStore/utils/asserters'
export {
  type ConnectedStatus,
  CONNECTING,
  type ConnectingStatus,
  type ConnectionStatus,
  type ConnectionStatusStore,
  type ConnectionStatusStoreOptions,
  createConnectionStatusStore,
  type ErrorStatus,
  onRetry,
  type RetryingStatus,
} from '../core/store/connection-status/connection-status-store'
export {
  useComlinkStore,
  useConnectionStatusStore,
  useGrantsStore,
  useHistoryStore,
  useKeyValueStore,
  usePresenceStore,
  useProjectStore,
  useRenderingContextStore,
} from '../core/store/datastores'
export {
  type BufferedDocumentWrapper,
  createBufferedDocument,
} from '../core/store/document/buffered-doc/createBufferedDocument'
export {
  type CommitRequest,
  createObservableBufferedDocument,
} from '../core/store/document/buffered-doc/createObservableBufferedDocument'
export {type CommitFunction} from '../core/store/document/buffered-doc/types'
export {checkoutPair, type CommitError} from '../core/store/document/document-pair/checkoutPair'
export {editState} from '../core/store/document/document-pair/editState'
export {emitOperation, operationEvents} from '../core/store/document/document-pair/operationEvents'
export {
  type Operation,
  type OperationArgs,
  type OperationImpl,
  type OperationsAPI,
} from '../core/store/document/document-pair/operations/types'
export {remoteSnapshots} from '../core/store/document/document-pair/remoteSnapshots'
export {
  type DocumentVersionSnapshots,
  snapshotPair,
} from '../core/store/document/document-pair/snapshotPair'
export {validation} from '../core/store/document/document-pair/validation'
export {createDocumentStore, type DocumentStoreOptions} from '../core/store/document/document-store'
export {
  type DocumentPairLoadedEvent,
  type DocumentRebaseTelemetryEvent,
  type DocumentStoreExtraOptions,
  getPairListener,
  type InitialSnapshotEvent,
  type LatencyReportEvent,
  type ListenerEvent,
  type MutationPerformanceEvent,
} from '../core/store/document/getPairListener'
export {
  type DocumentTypeResolveState,
  useDocumentType,
} from '../core/store/document/hooks/useDocumentType'
export {getInitialValueStream} from '../core/store/document/initialValue/initialValue'
export {type InitialValueState} from '../core/store/document/initialValue/types'
export {isNewDocument} from '../core/store/document/isNewDocument'
export {listenQuery} from '../core/store/document/listenQuery'
export {selectUpstreamVersion} from '../core/store/document/selectUpstreamVersion'
export {
  type DocumentPairTarget,
  type IdPair,
  type MutationEvent,
  type PendingMutationsEvent,
} from '../core/store/document/types'
export {
  useInitialValue,
  useInitialValueResolverContext,
} from '../core/store/document/useInitialValue'
export {EventsProvider, useEvents} from '../core/store/events/EventsProvider'
export {
  type DocumentVersionEventType,
  type EventsStore,
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
} from '../core/store/events/types'
export {useEventsStore} from '../core/store/events/useEventsStore'
export {
  type DocumentPairPermissionsOptions,
  type DocumentPermission,
  getDocumentPairPermissions,
  useDocumentPairPermissionsFromHookFactory,
} from '../core/store/grants/documentPairPermissions'
export {
  type DocumentValuePermissionsOptions,
  getDocumentValuePermissions,
  useDocumentValuePermissions,
} from '../core/store/grants/documentValuePermissions'
export {
  createGrantsStore,
  grantsPermissionOn,
  type GrantsStoreOptions,
} from '../core/store/grants/grantsStore'
export {
  getTemplatePermissions,
  type TemplatePermissionsOptions,
  type TemplatePermissionsResult,
  useTemplatePermissions,
  useTemplatePermissionsFromHookFactory,
} from '../core/store/grants/templatePermissions'
export {type EvaluationParams, type Grant} from '../core/store/grants/types'
export {
  createHistoryStore,
  type HistoryStoreOptions,
  removeMissingReferences,
} from '../core/store/history/createHistoryStore'
export {
  // oxlint-disable-next-line no-deprecated -- the legacy document timeline stays exported while deprecated; removing it is a breaking change deferred to the next major
  Timeline,
} from '../core/store/history/history/Timeline'
export {
  // oxlint-disable-next-line no-deprecated -- the legacy document timeline stays exported while deprecated; removing it is a breaking change deferred to the next major
  TimelineController,
} from '../core/store/history/history/TimelineController'
// oxlint-disable-next-line no-deprecated -- the legacy document timeline stays exported while deprecated; removing it is a breaking change deferred to the next major
export {useTimelineSelector} from '../core/store/history/useTimelineSelector'
export {
  // oxlint-disable-next-line no-deprecated -- the legacy document timeline stays exported while deprecated; removing it is a breaking change deferred to the next major
  type TimelineState,
  // oxlint-disable-next-line no-deprecated -- the legacy document timeline stays exported while deprecated; removing it is a breaking change deferred to the next major
  type TimelineStore,
  // oxlint-disable-next-line no-deprecated -- the legacy document timeline stays exported while deprecated; removing it is a breaking change deferred to the next major
  useTimelineStore,
} from '../core/store/history/useTimelineStore'
export {createKeyValueStore} from '../core/store/key-value/keyValueStore'
export {type KeyValueStore, type KeyValueStoreValue} from '../core/store/key-value/types'
export {createPresenceStore, SESSION_ID} from '../core/store/presence/presence-store'
export {
  type DocumentPresence,
  type GlobalPresence,
  type PresenceLocation,
  type Session,
  type Status,
  type UserSessionPair,
} from '../core/store/presence/types'
export {useGlobalPresence} from '../core/store/presence/useGlobalPresence'
export {createProjectStore, getProjectGrants} from '../core/store/project/projectStore'
export {useProject} from '../core/store/project/useProject'
export {useProjectDatasets} from '../core/store/project/useProjectDatasets'
export {type StoreRequestErrorHandler} from '../core/store/requestErrorHandler'
export {useUser} from '../core/store/user/hooks'
export {createUserStore, type UserStoreOptions} from '../core/store/user/userStore'
export {type NavbarContextValue} from '../core/studio/StudioLayout'
export {StudioLayoutComponent} from '../core/studio/StudioLayoutComponent'
export {
  ActiveWorkspaceMatcher,
  type ActiveWorkspaceMatcherProps,
} from '../core/studio/activeWorkspaceMatcher/ActiveWorkspaceMatcher'
export {type ActiveWorkspaceMatcherContextValue} from '../core/studio/activeWorkspaceMatcher/ActiveWorkspaceMatcherContext'
export {
  matchWorkspace,
  type MatchWorkspaceOptions,
  type MatchWorkspaceResult,
} from '../core/studio/activeWorkspaceMatcher/matchWorkspace'
export {AddonDatasetProvider} from '../core/studio/addonDataset/AddonDatasetProvider'
export {useAddonDataset} from '../core/studio/addonDataset/useAddonDataset'
export {
  ColorSchemeCustomProvider,
  ColorSchemeLocalStorageProvider,
  ColorSchemeProvider,
  type ColorSchemeProviderProps,
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  useColorScheme,
  useColorSchemeInternalValue,
  useColorSchemeOptions,
  useColorSchemeSetValue,
} from '../core/studio/colorScheme'
export {StudioLogo} from '../core/studio/components/navbar/StudioLogo'
export {StudioNavbar} from '../core/studio/components/navbar/StudioNavbar'
export {
  DiagnosticsReport,
  type DiagnosticsReportProps,
} from '../core/studio/components/navbar/resources/DiagnosticsReport'
export {SearchButton} from '../core/studio/components/navbar/search/SearchButton'
export {SearchDialog} from '../core/studio/components/navbar/search/SearchDialog'
export {SearchHeader} from '../core/studio/components/navbar/search/components/SearchHeader'
export {
  SearchPopover,
  type SearchPopoverProps,
} from '../core/studio/components/navbar/search/components/SearchPopover'
export {Filters} from '../core/studio/components/navbar/search/components/filters/Filters'
export {SearchResultItemPreview} from '../core/studio/components/navbar/search/components/searchResults/item/SearchResultItemPreview'
export {type SearchContextValue} from '../core/studio/components/navbar/search/contexts/search/SearchContext'
export {SearchProvider} from '../core/studio/components/navbar/search/contexts/search/SearchProvider'
export {useSearchState} from '../core/studio/components/navbar/search/contexts/search/useSearchState'
export {
  defineSearchFilter,
  defineSearchFilterOperators,
} from '../core/studio/components/navbar/search/definitions/filters'
export {operatorDefinitions} from '../core/studio/components/navbar/search/definitions/operators/defaultOperators'
export {defineSearchOperator} from '../core/studio/components/navbar/search/definitions/operators/operatorTypes'
export {
  type PartialIndexSettings,
  useSearchMaxFieldDepth,
} from '../core/studio/components/navbar/search/hooks/useSearchMaxFieldDepth'
export {StudioToolMenu} from '../core/studio/components/navbar/tools/StudioToolMenu'
export {CopyPasteProvider, useCopyPaste} from '../core/studio/copyPaste/CopyPasteProvider'
export {
  StudioDiagnosticsBridge,
  type StudioDiagnosticsBridgeApi,
} from '../core/studio/diagnostics/StudioDiagnosticsBridge'
export {type StudioDiagnostics} from '../core/studio/diagnostics/gatherStudioDiagnostics'
export {parseStudioDiagnostics} from '../core/studio/diagnostics/parseStudioDiagnostics'
export {StudioFeedbackProvider} from '../core/studio/feedback/StudioFeedbackProvider'
export {LiveManifestRegisterProvider} from '../core/studio/manifest/LiveManifestRegisterProvider'
export {
  generateStudioManifest,
  type GenerateStudioManifestOptions,
} from '../core/studio/manifest/generateStudioManifest'
export {
  type ManifestWorkspaceInput,
  type StudioWorkspaceManifest,
} from '../core/studio/manifest/types'
export {uploadSchema} from '../core/studio/manifest/uploadSchema'
export {
  RequestErrorDialog,
  useRetryCountdown,
} from '../core/studio/requestErrors/RequestErrorDialog'
export {
  classifyConfigError,
  classifyRequestError,
  type ConfigErrorClassification,
  isClientRequestError,
  isNetworkError,
  parseRetryAfter,
  type RequestErrorClassification,
} from '../core/studio/requestErrors/classify'
export {
  createRequestErrorChannel,
  passthroughErrorHandler,
} from '../core/studio/requestErrors/createRequestErrorChannel'
export {type RequestErrorChannel, type RequestErrorClaim} from '../core/studio/requestErrors/types'
// oxlint-disable-next-line no-deprecated -- deprecated API stays available on the internals entry until it is removed
export {SourceProvider, type SourceProviderProps, useSource} from '../core/studio/source'
export {StudioAnnouncementsCard} from '../core/studio/studioAnnouncements/StudioAnnouncementsCard'
export {StudioAnnouncementsDialog} from '../core/studio/studioAnnouncements/StudioAnnouncementsDialog'
export {
  isValidAnnouncementAudience,
  isValidAnnouncementRole,
} from '../core/studio/studioAnnouncements/utils'
export {useTelemetryConsent} from '../core/studio/telemetry/useTelemetryConsent'
export {
  UpsellDialogDismissed,
  UpsellDialogLearnMoreCtaClicked,
  UpsellDialogUpgradeCtaClicked,
  UpsellDialogViewed,
  type UpsellDialogViewedInfo,
} from '../core/studio/upsell/__telemetry__/upsell.telemetry'
export {
  type InterpolationProp,
  UpsellDescriptionSerializer,
} from '../core/studio/upsell/upsellDescriptionSerializer/UpsellDescriptionSerializer'
export {WorkspaceProvider, type WorkspaceProviderProps} from '../core/studio/workspace'
export {ErrorMessage, type ErrorMessageProps} from '../core/studio/workspaceLoader/ErrorMessage'
export {useWorkspaceLoader, WorkspaceLoader} from '../core/studio/workspaceLoader/WorkspaceLoader'
export {ConfigErrorGate} from '../core/studio/workspaces/ConfigErrorGate'
export {CorsOriginErrorScreen} from '../core/studio/workspaces/CorsOriginErrorScreen'
export {
  type VisibleWorkspacesContextValue,
  VisibleWorkspacesProvider,
} from '../core/studio/workspaces/VisibleWorkspacesProvider'
export {type WorkspacesContextValue} from '../core/studio/workspaces/WorkspacesContext'
export {
  type CorsCheckResult,
  type CorsProbeOutcome,
  WorkspacesProvider,
  type WorkspacesProviderProps,
} from '../core/studio/workspaces/WorkspacesProvider'
export {
  getNamelessWorkspaceIdentifier,
  getWorkspaceIdentifier,
} from '../core/studio/workspaces/helpers'
export {type WorkspaceLike} from '../core/studio/workspaces/types'
export {
  evaluateWorkspaceHidden,
  useVisibleWorkspaces,
} from '../core/studio/workspaces/useVisibleWorkspaces'
export {useWorkspaces} from '../core/studio/workspaces/useWorkspaces'
export {
  validateBasePaths,
  validateNames,
  type ValidateWorkspaceOptions,
  validateWorkspaces,
} from '../core/studio/workspaces/validateWorkspaces'
export {IsLastPaneProvider} from '../core/tasks/context/isLastPane/IsLastPaneProvider'
export {useDocumentPreviewValues} from '../core/tasks/hooks/useDocumentPreviewValues'
export {
  defaultTemplateForType,
  defaultTemplatesForSchema,
  prepareTemplates,
} from '../core/templates/prepare'
export {
  DEFAULT_MAX_RECURSION_DEPTH,
  isBuilder,
  RESOLVE_INITIAL_VALUE_TIMEOUT_MS,
  resolveInitialObjectValue,
  resolveInitialValue,
  resolveInitialValueForType,
  type Serializeable,
} from '../core/templates/resolve'
// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
export {defaultTheme} from '../core/theme'
// oxlint-disable-next-line no-deprecated -- deprecated API stays available on the internals entry until it is removed
export {type LegacyThemeTints} from '../core/theme/_legacy/types'
export {useUserColor} from '../core/user-color/hooks'
export {createUserColorManager, type UserColorManagerOptions} from '../core/user-color/manager'
export {
  UserColorManagerProvider,
  type UserColorManagerProviderProps,
} from '../core/user-color/provider'
export {
  type HexColor,
  type UserColor,
  type UserColorHue,
  type UserColorManager,
  type UserId,
} from '../core/user-color/types'
export {type PartialExcept} from '../core/util/PartialExcept'
export {getApiErrorCode, isInvalidSessionError, isUnauthorizedError} from '../core/util/apiErrors'
export {catchWithCount} from '../core/util/catchWithCount'
export {type LoadingTuple, type ReactHook} from '../core/util/createHookFromObservableFactory'
export {
  type CollatedHit,
  createDraftFrom,
  createPublishedFrom,
  documentIdEquals,
  getIdPair,
  idMatchesPerspective,
  isDraft,
  isSystemBundle,
  isSystemBundleName,
  newDraftFrom,
  removeDupes,
  systemBundles,
} from '../core/util/draftUtils'
export {EMPTY_ARRAY, EMPTY_OBJECT} from '../core/util/empty'
export {formatRelativeLocale} from '../core/util/formatRelativeLocale'
export {getDocumentVariantType} from '../core/util/getDocumentVariantType'
export {getErrorMessage} from '../core/util/getErrorMessage'
export {getReferencePaths} from '../core/util/getReferencePaths'
export {getTargetDocument, getVariantPublishedSibling} from '../core/util/getTargetDocument'
export {globalScope} from '../core/util/globalScope'
export {isArray} from '../core/util/isArray'
export {isNonNullable} from '../core/util/isNonNullable'
export {isString} from '../core/util/isString'
export {isTruthy} from '../core/util/isTruthy'
export {measureFirstEmission, measureFirstMatch} from '../core/util/measureFirstEmission'
export {
  type CardinalityOneRelease,
  isCardinalityOnePerspective,
  isCardinalityOneRelease,
  isPausedCardinalityOneRelease,
} from '../core/util/releaseUtils'
export {createSWR} from '../core/util/rxSwr'
export {
  _isCustomDocumentTypeDefinition,
  _isSanityDocumentTypeDefinition,
  _isType,
} from '../core/util/schemaUtils'
export {escapeField, fieldNeedsEscape, joinPath} from '../core/util/searchUtils'
export {supportsTouch} from '../core/util/supportsTouch'
export {uncaughtErrorHandler} from '../core/util/uncaughtErrorHandler'
export {sliceString} from '../core/util/unicodeString'
export {
  asLoadable,
  type ErrorState,
  type LoadableState,
  type LoadedState,
  type LoadingState,
  useLoadable,
} from '../core/util/useLoadable'
export {useShallowUnique} from '../core/util/useShallowUnique'
export {useThrottledCallback} from '../core/util/useThrottledCallback'
// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
export {useUnique} from '../core/util/useUnique'
export {
  isDraftVersion,
  isPublishedVersion,
  isReleaseVersion,
  isVariantVersion,
  readVersionType,
} from '../core/util/versionsUtils'
export {isDocumentInSelectedVariant} from '../core/variants/documents/isDocumentInSelectedVariant'
export {useCreatableVariantInitialValue} from '../core/variants/hooks/useCreatableVariantInitialValue'
export {useVariantDocumentOperations} from '../core/variants/hooks/useVariantDocumentOperations'
export {VARIANTS_STUDIO_CLIENT_OPTIONS} from '../core/variants/store/constants'
export {useAllVariants} from '../core/variants/store/useAllVariants'
export {getVariantTitle} from '../core/variants/tool/util'
export {isVariantId} from '../core/variants/types'
export {_createNode} from '../router/route'
export {STICKY_PARAMS} from '../router/stickyParams'
export {
  type InternalSearchParam,
  type MatchError,
  type MatchOk,
  type MatchResult,
  type NextStateOrOptions,
} from '../router/types'
export {decodeJsonParams, encodeJsonParams} from '../router/utils/jsonParamsEncoding'
// oxlint-disable-next-line no-deprecated -- deprecated API stays available on the internals entry until it is removed
export {withRouter, WithRouter, type WithRouterProps} from '../router/withRouter'
export {
  StructureToolProvider,
  type StructureToolProviderProps,
} from '../structure/StructureToolProvider'
export {ConfirmDeleteDialog} from '../structure/components/confirmDeleteDialog'
export {type ConfirmDeleteDialogProps} from '../structure/components/confirmDeleteDialog/ConfirmDeleteDialog'
export {Pane} from '../structure/components/pane/Pane'
export {PaneContent} from '../structure/components/pane/PaneContent'
export {DocumentPane} from '../structure/panes/document/DocumentPane'
export {type DocumentPaneProviderProps} from '../structure/panes/document/types'
export {usePaneOptions} from '../structure/panes/document/usePaneOptions'
export {type DocumentListPaneProps} from '../structure/panes/documentList'
export {PaneContainer as DocumentListPane} from '../structure/panes/documentList/PaneContainer'
export {ORDER_BY_IDS_PARAM_FIELD} from '../structure/panes/documentList/orderByIdsParam'
export {
  documentFromEditor,
  documentFromEditorWithInitialValue,
} from '../structure/structureBuilder/Document'
export {getTypeNamesFromFilter} from '../structure/structureBuilder/DocumentList'
export {isDocumentListItem} from '../structure/structureBuilder/DocumentListItem'
export {shallowIntentChecker} from '../structure/structureBuilder/GenericList'
export {
  defaultInitialValueTemplateItems,
  maybeSerializeInitialValueTemplateItem,
  menuItemsFromInitialValueTemplateItems,
} from '../structure/structureBuilder/InitialValueTemplateItem'
export {DEFAULT_INTENT_HANDLER, defaultIntentChecker} from '../structure/structureBuilder/Intent'
export {
  getOrderingMenuItem,
  getOrderingMenuItemsForSchemaType,
  maybeSerializeMenuItem,
  type SortMenuItem,
} from '../structure/structureBuilder/MenuItem'
export {maybeSerializeMenuItemGroup} from '../structure/structureBuilder/MenuItemGroup'
export {HELP_URL, SerializeError} from '../structure/structureBuilder/SerializeError'
export {type Builder} from '../structure/structureBuilder/StructureNodes'
export {
  createStructureBuilder,
  type StructureBuilderOptions,
} from '../structure/structureBuilder/createStructureBuilder'
export {component, form} from '../structure/structureBuilder/views'
export {maybeSerializeView} from '../structure/structureBuilder/views/View'
export {
  type BaseResolvedPaneNode,
  type CustomComponentPaneNode,
  type DocumentListPaneNode,
  type DocumentPaneNode,
  type ListPaneNode,
  type PaneListItem,
  type PaneListItemDivider,
  type PaneMenuItem,
  type PaneMenuItemGroup,
  type PaneNode,
  type PaneNodeResolver,
  type RouterPaneSiblingContext,
  type SerializablePaneNode,
  type StrictVersionLayeringOptions,
  type StructureToolContextValue,
  type StructureToolFeatures,
  type StructureToolPaneActionHandler,
  type UnresolvedPaneNode,
} from '../structure/types'
export {useStructureTool} from '../structure/useStructureTool'
export {Rule as ConcreteRuleClass, type ValidationContext} from '@sanity/validation/_internal'
