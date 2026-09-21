import 'ui5/styles.css'
import '@sanity/ui/styles.css'
// oxlint-disable-next-line import/no-unassigned-import -- side effect: keeps the module augmentations declared by this module on the public type surface
import '../core/form/types/definitionExtensions'

export {useCanvasCompanionDoc} from '../core/canvas/actions/useCanvasCompanionDoc'
export {ChangeIndicator, type ChangeIndicatorProps} from '../core/changeIndicators/ChangeIndicator'
export {type ConnectorContextValue} from '../core/changeIndicators/ConnectorContext'
export {type ChangeConnectorRootProps} from '../core/changeIndicators/overlay/ChangeConnectorRoot'
export {
  type ChangeIndicatorTrackerContextValue,
  type TrackedArea,
  type TrackedChange,
} from '../core/changeIndicators/types'
export {
  type CommentInputHandle,
  type CommentInputProps,
} from '../core/comments-v2/components/pte/comment-input/CommentInput'
export {
  type CommentInputHandle as CommentInputHandleLegacy,
  type CommentInputProps as CommentInputPropsLegacy,
} from '../core/comments/components/pte/comment-input/CommentInput'
export {type CommentsIntentProviderProps} from '../core/comments/context/intent/CommentsIntentProvider'
export {type CommentsSelectedPath} from '../core/comments-v2/context/selected-path/types'
export {type CommentsSelectedPath as CommentsSelectedPathLegacy} from '../core/comments/context/selected-path/types'
export {useCommentsMode} from '../core/comments-v2/hooks/useCommentsMode'
export {useCommentsMode as useCommentsModeLegacy} from '../core/comments/hooks/useCommentsMode'
export {
  type CommentBaseCreatePayload,
  type CommentContext,
  type CommentCreatePayload,
  type CommentDocument,
  type CommentFieldCreatePayload,
  type CommentIntentGetter,
  type CommentListBreadcrumbs,
  type CommentMessage,
  type CommentOperations,
  type CommentPath,
  type CommentPostPayload,
  type CommentReactionItem,
  type CommentReactionOption,
  type CommentReactionShortNames,
  type CommentsListBreadcrumbItem,
  type CommentStatus,
  type CommentsTextSelectionItem,
  type CommentsType,
  type CommentsUIMode,
  type CommentTaskCreatePayload,
  type CommentTextSelection,
  type CommentThreadItem,
  type CommentUpdateOperationOptions,
  type CommentUpdatePayload,
  type Loadable,
} from '../core/comments-v2/types'
export {
  type CommentBaseCreatePayload as CommentBaseCreatePayloadLegacy,
  type CommentContext as CommentContextLegacy,
  type CommentCreatePayload as CommentCreatePayloadLegacy,
  type CommentDocument as CommentDocumentLegacy,
  type CommentFieldCreatePayload as CommentFieldCreatePayloadLegacy,
  type CommentListBreadcrumbs as CommentListBreadcrumbsLegacy,
  type CommentMessage as CommentMessageLegacy,
  type CommentOperations as CommentOperationsLegacy,
  type CommentPath as CommentPathLegacy,
  type CommentPostPayload as CommentPostPayloadLegacy,
  type CommentReactionItem as CommentReactionItemLegacy,
  type CommentReactionOption as CommentReactionOptionLegacy,
  type CommentReactionShortNames as CommentReactionShortNamesLegacy,
  type CommentsListBreadcrumbItem as CommentsListBreadcrumbItemLegacy,
  type CommentStatus as CommentStatusLegacy,
  type CommentsTextSelectionItem as CommentsTextSelectionItemLegacy,
  type CommentsType as CommentsTypeLegacy,
  type CommentsUIMode as CommentsUIModeLegacy,
  type CommentTaskCreatePayload as CommentTaskCreatePayloadLegacy,
  type CommentTextSelection as CommentTextSelectionLegacy,
  type CommentThreadItem as CommentThreadItemLegacy,
  type CommentUpdateOperationOptions as CommentUpdateOperationOptionsLegacy,
  type CommentUpdatePayload as CommentUpdatePayloadLegacy,
  type Loadable as LoadableLegacy,
} from '../core/comments/types'
export {type BetaBadgeProps} from '../core/components/BetaBadge'
export {type CollapseMenuProps} from '../core/components/collapseMenu/CollapseMenu'
export {
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
// oxlint-disable-next-line no-deprecated -- preserved for backwards compatibility
export {DocumentStatus} from '../core/components/documentStatus/DocumentStatus'
// oxlint-disable-next-line no-deprecated -- preserved for backwards compatibility
export {DocumentStatusIndicator} from '../core/components/documentStatusIndicator/DocumentStatusIndicator'
export {type ErrorActionsProps} from '../core/components/errorActions/ErrorActions'
export {type ErrorWithId} from '../core/components/errorActions/types'
export {
  type GetHookCollectionStateProps,
  type HookCollectionActionHook,
} from '../core/components/hookCollection/types'
export {Hotkeys, type HotkeysProps} from '../core/components/Hotkeys'
export {
  InsufficientPermissionsMessage,
  type InsufficientPermissionsMessageProps,
} from '../core/components/InsufficientPermissionsMessage'
export {IntentButton} from '../core/components/IntentButton'
export {LoadingBlock} from '../core/components/loadingBlock/LoadingBlock'
export {PreviewCard, type PreviewCardContextValue} from '../core/components/previewCard/PreviewCard'
export {
  CompactPreview,
  type CompactPreviewProps,
} from '../core/components/previews/general/CompactPreview'
export {
  DefaultPreview,
  type DefaultPreviewProps,
} from '../core/components/previews/general/DefaultPreview'
export {
  DetailPreview,
  type DetailPreviewProps,
} from '../core/components/previews/general/DetailPreview'
export {
  MediaPreview,
  type MediaPreviewProps,
} from '../core/components/previews/general/MediaPreview'
export {
  BlockImagePreview,
  type BlockImagePreviewProps,
} from '../core/components/previews/portableText/BlockImagePreview'
export {BlockPreview} from '../core/components/previews/portableText/BlockPreview'
export {
  InlinePreview,
  type InlinePreviewProps,
} from '../core/components/previews/portableText/InlinePreview'
export {
  TemplatePreview,
  type TemplatePreviewProps,
} from '../core/components/previews/template/TemplatePreview'
export {
  type GeneralDocumentListLayoutKey,
  type GeneralPreviewLayoutKey,
  type PortableTextPreviewLayoutKey,
  type PreviewComponent,
  type PreviewLayoutKey,
  type PreviewMediaDimensions,
  type PreviewProps,
} from '../core/components/previews/types'
export {CircularProgress} from '../core/components/progress/CircularProgress'
export {LinearProgress} from '../core/components/progress/LinearProgress'
export {
  type TrackerContextGetSnapshot,
  type TrackerContextStore,
} from '../core/components/react-track-elements/hooks'
export {
  type IsEqualFunction,
  type Reported,
  type ReporterHook,
} from '../core/components/react-track-elements/types'
export {type RelativeTimeProps} from '../core/components/RelativeTime'
export {
  type RovingFocusNavigationType,
  type RovingFocusProps,
} from '../core/components/rovingFocus/types'
export {useRovingFocus} from '../core/components/rovingFocus/useRovingFocus'
export {type ScrollContainerProps} from '../core/components/scroll/scrollContainer'
export {type ScrollContextValue, type ScrollEventHandler} from '../core/components/scroll/types'
export {StatusButton, type StatusButtonProps} from '../core/components/StatusButton'
export {TextWithTone, type TextWithToneProps} from '../core/components/textWithTone/TextWithTone'
// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
export {ImperativeToast, type ToastParams} from '../core/components/transitional/ImperativeToast'
export {type ZIndexContextValueKey} from '../core/components/transitional/LegacyLayerProvider'
export {
  AvatarSkeleton,
  UserAvatar,
  type UserAvatarProps,
} from '../core/components/userAvatar/UserAvatar'
// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
export {WithReferringDocuments} from '../core/components/WithReferringDocuments'
export {type ZIndexContextValue} from '../core/components/zOffsets/types'
export {
  type AuthConfig,
  type AuthProvider,
  type CookielessCompatibleLoginMethod,
  type LoginMethod,
} from '../core/config/auth/types'
export {type ConfigPropertyErrorOptions} from '../core/config/ConfigPropertyError'
export {type ConfigResolutionErrorOptions} from '../core/config/ConfigResolutionError'
export {createDefaultIcon} from '../core/config/createDefaultIcon'
// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
export {createConfig, defineConfig} from '../core/config/defineConfig'
// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
export {createPlugin, definePlugin, type PluginFactory} from '../core/config/definePlugin'
export {defineSingleton} from '../core/config/defineSingleton'
export {
  type DocumentActionComponent,
  type DocumentActionConfirmDialogProps,
  type DocumentActionCustomDialogComponentProps,
  type DocumentActionDescription,
  type DocumentActionDialogProps,
  type DocumentActionGroup,
  type DocumentActionKeys,
  type DocumentActionModalDialogProps,
  type DocumentActionPopoverDialogProps,
  type DocumentActionProps,
  type DuplicateActionProps,
  type DuplicateDocumentActionComponent,
  isSanityDefinedAction,
  type SanityDefinedAction,
} from '../core/config/document/actions'
export {
  type DocumentBadgeComponent,
  type DocumentBadgeDescription,
  type DocumentBadgeProps,
} from '../core/config/document/badges'
export {defineDocumentFieldAction} from '../core/config/document/fieldActions/define'
export {
  type DocumentFieldAction,
  type DocumentFieldActionDivider,
  type DocumentFieldActionGroup,
  type DocumentFieldActionHook,
  type DocumentFieldActionItem,
  type DocumentFieldActionNode,
  type DocumentFieldActionProps,
  type DocumentFieldActionsResolver,
  type DocumentFieldActionsResolverContext,
  type DocumentFieldActionStatus,
  type DocumentFieldActionTone,
} from '../core/config/document/fieldActions/types'
export {
  defineDocumentInspector,
  type DocumentInspector,
  type DocumentInspectorComponent,
  type DocumentInspectorMenuItem,
  type DocumentInspectorProps,
  type DocumentInspectorUseMenuItemProps,
} from '../core/config/document/inspector'
export {type FormComponents} from '../core/config/form/types'
export {
  type ReleaseActionComponent,
  type ReleaseActionDescription,
  type ReleaseActionProps,
  type ReleaseActionsContext,
} from '../core/config/releases/actions'
export {type CreateWorkspaceFromConfigOptions, resolveConfig} from '../core/config/resolveConfig'
export {SchemaError, type SchemaErrorContext} from '../core/config/SchemaError'
export {
  type ActiveToolLayoutProps,
  type LayoutProps,
  type LogoProps,
  type NavbarAction,
  type NavbarProps,
  type ProviderProps,
  type StudioComponents,
  type StudioComponentsPluginOptions,
  type ToolMenuProps,
} from '../core/config/studio/types'
export {
  type ActionComponent,
  type AppsOptions,
  type AssetSourceResolver,
  type AsyncComposableOption,
  type AsyncConfigPropertyReducer,
  type BaseActionDescription,
  type BetaFeatures,
  type ComposableOption,
  type Config,
  type ConfigContext,
  type ConfigPropertyReducer,
  type DefaultPluginsWorkspaceOptions,
  type DocumentActionsContext,
  type DocumentActionsResolver,
  type DocumentActionsVersionType,
  type DocumentAskToEditEnabledContext,
  type DocumentBadgesContext,
  type DocumentBadgesResolver,
  type DocumentCommentsEnabledContext,
  type DocumentInspectorContext,
  type DocumentInspectorsResolver,
  type DocumentLanguageFilterComponent,
  type DocumentLanguageFilterContext,
  type DocumentLanguageFilterResolver,
  type DocumentLayoutProps,
  type DocumentPluginOptions,
  type FederatedAssetSourcesConfig,
  type FederatedAssetSourceViewInfo,
  type FormBuilderComponentResolverContext,
  type GroupableActionDescription,
  type MediaLibraryConfig,
  type MissingConfigFile,
  type NewDocumentCreationContext,
  type NewDocumentOptionsContext,
  type NewDocumentOptionsResolver,
  type PartialContext,
  type Plugin,
  type PluginOptions,
  type PreparedConfig,
  type ReleaseActionsResolver,
  type ResolveProductionUrlContext,
  type SanityFormConfig,
  type ScheduledPublishingPluginOptions,
  type SchemaPluginOptions,
  type SingletonDefinition,
  type SingletonsResolver,
  type SingleWorkspace,
  type Source,
  type SourceClientOptions,
  type SourceOptions,
  type TemplateResolver,
  type Tool,
  type UnresolvedSingletonDefinition,
  type VariantConditionMap,
  type VariantConditions,
  type VariantConditionsContext,
  type VariantConditionValue,
  type VariantTypeConfig,
  type VariantTypeContext,
  type VariantTypesConfig,
  type Workspace,
  type WorkspaceHiddenContext,
  type WorkspaceHiddenProperty,
  type WorkspaceOptions,
  type WorkspaceSummary,
} from '../core/config/types'
export {
  type DocumentGroupInventoryHandle,
  type DocumentGroupInventoryProps,
} from '../core/documentGroupInventory/components/DocumentGroupInventory'
export {type DocumentGroupInventoryFeedbackActionProps} from '../core/documentGroupInventory/components/DocumentGroupInventoryFeedbackAction'
export {useDocumentVersionTitle} from '../core/hooks/useDocumentVersionTitle'
export {
  type DocumentGroupInventoryComponents,
  type DocumentGroupInventoryPerspectiveList,
  type DocumentGroupInventoryReferencePreviewLinkProps,
} from '../core/documentGroupInventory/types'
export {isDev} from '../core/environment'
export {type FeedbackDialogProps} from '../core/feedback/components/FeedbackDialog'
export {type StudioFeedbackDialogProps} from '../core/feedback/components/StudioFeedbackDialog'
export {type UseFeedbackReturn} from '../core/feedback/hooks/useFeedback'
export {
  type SendFeedbackOptions,
  type UseInStudioFeedbackReturn,
} from '../core/feedback/hooks/useInStudioFeedback'
export {
  type BaseFeedbackTags,
  type DynamicFeedbackTags,
  type FeedbackContextValue,
  type FeedbackPayload,
  type Sentiment,
  type TagValue,
} from '../core/feedback/types'
export {
  type DiffVisitor,
  getAnnotationAtPath,
  getDiffAtPath,
} from '../core/field/diff/annotations/helpers'
export {useAnnotationColor, useDiffAnnotationColor} from '../core/field/diff/annotations/hooks'
export {ChangeList, type ChangeListProps} from '../core/field/diff/components/ChangeList'
export {type ChangeResolverProps} from '../core/field/diff/components/ChangeResolver'
export {DiffCard, type DiffCardProps} from '../core/field/diff/components/DiffCard'
export {
  type DiffErrorBoundaryProps,
  type DiffErrorBoundaryState,
} from '../core/field/diff/components/DiffErrorBoundary'
export {DiffFromTo, type DiffFromToProps} from '../core/field/diff/components/DiffFromTo'
export {type DiffInspectWrapperProps} from '../core/field/diff/components/DiffInspectWrapper'
export {
  DiffTooltip,
  type DiffTooltipProps,
  type DiffTooltipWithAnnotationsProps,
} from '../core/field/diff/components/DiffTooltip'
export {type FromToProps} from '../core/field/diff/components/FromTo'
export {type FromToArrowDirection} from '../core/field/diff/components/FromToArrow'
export {type MetaInfoProps} from '../core/field/diff/components/MetaInfo'
export {type DocumentChangeContextInstance} from '../core/field/diff/contexts/DocumentChangeContext'
export {
  getValueAtPath,
  pathsAreEqual,
  pathToString,
  stringToPath,
} from '../core/field/paths/helpers'
export {type FieldPreviewComponent} from '../core/field/preview/types'
export {
  type Annotation,
  type AnnotationDetails,
  type ArrayDiff,
  type ArrayItemMetadata,
  type BooleanDiff,
  type ChangeNode,
  type ChangeTitlePath,
  type Chunk,
  type ChunkType,
  type Diff,
  type DiffComponent,
  type DiffComponentOptions,
  type DiffComponentResolver,
  type DiffProps,
  type FieldChangeNode,
  type FieldOperationsAPI,
  type FromToIndex,
  type GroupChangeNode,
  type ItemDiff,
  type NullDiff,
  type NumberDiff,
  type ObjectDiff,
  type ReferenceDiff,
  type StringDiff,
  type StringDiffSegment,
  type StringSegmentChanged,
  type StringSegmentUnchanged,
  type TypeChangeDiff,
} from '../core/field/types'
export {type FieldValueError} from '../core/field/validation'
export {type FIXME} from '../core/FIXME'
export {EditPortal} from '../core/form/components/EditPortal'
export {EnhancedObjectDialog} from '../core/form/components/EnhancedObjectDialog'
export {FormField, type FormFieldProps} from '../core/form/components/formField/FormField'
export {
  FormFieldHeaderText,
  type FormFieldHeaderTextProps,
} from '../core/form/components/formField/FormFieldHeaderText'
export {type FormFieldSetProps} from '../core/form/components/formField/FormFieldSet'
export {type FieldStatusProps} from '../core/form/components/formField/FormFieldStatus'
export {
  FormFieldValidationStatus,
  type FormFieldValidationStatusProps,
} from '../core/form/components/formField/FormFieldValidationStatus'
export {
  type FormFieldValidation,
  type FormFieldValidationError,
  type FormFieldValidationInfo,
  type FormFieldValidationWarning,
} from '../core/form/components/formField/types'
export {
  FormInput,
  type FormInputAbsolutePathArg,
  type FormInputRelativePathArg,
} from '../core/form/components/FormInput'
export {type FormValueContextValue, useFormValue} from '../core/form/contexts/FormValue'
export {useGetFormValue} from '../core/form/contexts/GetFormValue'
export {type FieldActionMenuProps} from '../core/form/field/actions/FieldActionMenu'
export {type FieldActionsProps} from '../core/form/field/actions/FieldActionsResolver'
export {type FormBuilderContextValue} from '../core/form/FormBuilderContext'
export {useDidUpdate} from '../core/form/hooks/useDidUpdate'
export {ArrayOfObjectsFunctions} from '../core/form/inputs/arrays/ArrayOfObjectsInput/ArrayOfObjectsFunctions'
export {ArrayOfObjectsInput} from '../core/form/inputs/arrays/ArrayOfObjectsInput/ArrayOfObjectsInput'
export {type VirtualizerScrollInstance} from '../core/form/inputs/arrays/ArrayOfObjectsInput/List/useVirtualizerScrollInstance'
export {VirtualizerScrollInstanceProvider} from '../core/form/inputs/arrays/ArrayOfObjectsInput/List/VirtualizerScrollInstanceProvider'
export {ArrayOfObjectOptionsInput} from '../core/form/inputs/arrays/ArrayOfOptionsInput/ArrayOfObjectOptionsInput'
export {ArrayOfOptionsInput} from '../core/form/inputs/arrays/ArrayOfOptionsInput/ArrayOfOptionsInput'
export {ArrayOfPrimitiveOptionsInput} from '../core/form/inputs/arrays/ArrayOfOptionsInput/ArrayOfPrimitiveOptionsInput'
export {ArrayOfPrimitivesFunctions} from '../core/form/inputs/arrays/ArrayOfPrimitivesInput/ArrayOfPrimitivesFunctions'
export {ArrayOfPrimitivesInput} from '../core/form/inputs/arrays/ArrayOfPrimitivesInput/ArrayOfPrimitivesInput'
export {UniversalArrayInput} from '../core/form/inputs/arrays/UniversalArrayInput'
export {BooleanInput} from '../core/form/inputs/BooleanInput'
export {DateInput, type DateInputProps} from '../core/form/inputs/DateInputs/DateInput'
export {DateTimeInput, type DateTimeInputProps} from '../core/form/inputs/DateInputs/DateTimeInput'
export {EmailInput, type EmailInputProps} from '../core/form/inputs/EmailInput'
export {type AssetAccessPolicy} from '../core/form/inputs/files/types'
export {NumberInput} from '../core/form/inputs/NumberInput/NumberInput'
export {ObjectInput} from '../core/form/inputs/ObjectInput/ObjectInput'
export {
  PortableTextInput as BlockEditor,
  PortableTextInput,
  type PortableTextMemberItem,
} from '../core/form/inputs/PortableText/PortableTextInput'
export {type CreateReferenceOption} from '../core/form/inputs/ReferenceInput/types'
export {SelectInput} from '../core/form/inputs/SelectInput'
export {SlugInput, type SlugInputProps} from '../core/form/inputs/Slug/SlugInput'
export {StringInput} from '../core/form/inputs/StringInput/StringInput'
export {TagsArrayInput, type TagsArrayInputProps} from '../core/form/inputs/TagsArrayInput'
export {TelephoneInput, type TelephoneInputProps} from '../core/form/inputs/TelephoneInput'
export {TextInput, type TextInputProps} from '../core/form/inputs/TextInput'
export {UrlInput, type UrlInputProps} from '../core/form/inputs/UrlInput'
export {type ArrayOfObjectsMemberProps} from '../core/form/members/array/ArrayOfObjectsInputMember'
export {type ArrayOfObjectsInputMembersProps} from '../core/form/members/array/ArrayOfObjectsInputMembers'
export {
  ArrayOfObjectsItem,
  type MemberItemProps,
} from '../core/form/members/array/items/ArrayOfObjectsItem'
export {
  ArrayOfPrimitivesItem,
  type PrimitiveMemberItemProps,
} from '../core/form/members/array/items/ArrayOfPrimitivesItem'
export {MemberItemError} from '../core/form/members/array/MemberItemError'
export {MemberField, type MemberFieldProps} from '../core/form/members/object/MemberField'
export {MemberFieldError} from '../core/form/members/object/MemberFieldError'
export {MemberFieldSet} from '../core/form/members/object/MemberFieldset'
export {
  ObjectInputMember,
  type ObjectInputMemberProps,
} from '../core/form/members/object/ObjectInputMember'
export {
  ObjectInputMembers, // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  ObjectMembers,
  type ObjectMembersProps,
} from '../core/form/members/object/ObjectInputMembers'
export {
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
export {
  createPatchChannel,
  type MutationPatchMsg,
  type PatchChannel,
  type PatchMsg,
  type PatchMsgSubscriber,
  type RebasePatchMsg,
} from '../core/form/patch/PatchChannel'
export {PatchEvent} from '../core/form/patch/PatchEvent'
export {
  type FormDecPatch,
  type FormDiffMatchPatch,
  type FormIncPatch,
  type FormInsertPatch,
  type FormInsertPatchPosition,
  type FormPatch,
  type FormPatchBase,
  type FormPatchJSONValue,
  type FormPatchOrigin,
  type FormSetIfMissingPatch,
  type FormSetPatch,
  type FormUnsetPatch,
  type PatchArg,
} from '../core/form/patch/types'
export {ALL_FIELDS_GROUP} from '../core/form/store/constants'
export {type ProvenanceDiffAnnotation} from '../core/form/store/types/diff'
export {type FormFieldGroup} from '../core/form/store/types/fieldGroup'
export {type FieldsetMembers, type FieldsetState} from '../core/form/store/types/fieldsetState'
export {
  type ArrayItemError,
  type DuplicateKeysError,
  type FieldError,
  type IncompatibleTypeError,
  type InvalidItemTypeError,
  type MissingKeysError,
  type MixedArrayError,
  type TypeAnnotationMismatchError,
  type UndeclaredMembersError,
} from '../core/form/store/types/memberErrors'
export {
  type ArrayOfObjectsItemMember,
  type ArrayOfObjectsMember,
  type ArrayOfPrimitivesItemMember,
  type ArrayOfPrimitivesMember,
  type DecorationMember,
  type FieldMember,
  type FieldSetMember,
  type FieldsetRenderMembersCallback,
  type ObjectMember,
} from '../core/form/store/types/members'
export {
  type ArrayOfObjectsFormNode,
  type ArrayOfPrimitivesFormNode,
  type BaseFormNode,
  type BooleanFormNode,
  type ComputeDiff,
  type DocumentFormNode,
  type HiddenField,
  type NodeChronologyProps,
  type NodeDiffProps,
  type NumberFormNode,
  type ObjectArrayFormNode,
  type ObjectFormNode,
  type ObjectRenderMembersCallback,
  type PrimitiveFormNode,
  type StringFormNode,
} from '../core/form/store/types/nodes'
export {type StateTree} from '../core/form/store/types/state'
export {type FormState, type UseFormStateOptions} from '../core/form/store/useFormState'
export {
  type ExpandFieldSetOperation,
  type ExpandOperation,
  type ExpandPathOperation,
  type SetActiveGroupOperation,
} from '../core/form/store/utils/getExpandOperations'
export {type ParseError} from '../core/form/store/utils/mergeParseErrors'
export {
  createSanityMediaLibraryFileSource,
  createSanityMediaLibraryImageSource,
} from '../core/form/studio/assetSourceMediaLibrary/createAssetSource'
export {
  FormCallbacksProvider,
  type FormCallbacksValue,
  useFormCallbacks,
} from '../core/form/studio/contexts/FormCallbacks'
export {
  type EditReferenceLinkComponentProps,
  type EditReferenceOptions,
  type ReferenceInputOptions,
  type TemplateOption,
} from '../core/form/studio/contexts/ReferenceInputOptions'
export {FormBuilder, type FormBuilderProps} from '../core/form/studio/FormBuilder'
export {FormProvider, type FormProviderProps} from '../core/form/studio/FormProvider'
export {
  StudioCrossDatasetReferenceInput as CrossDatasetReferenceInput,
  type StudioCrossDatasetReferenceInputProps as CrossDatasetReferenceInputProps,
} from '../core/form/studio/inputs/crossDatasetReference/StudioCrossDatasetReferenceInput'
export {
  StudioReferenceInput as ReferenceInput,
  type StudioReferenceInputProps as ReferenceInputProps,
} from '../core/form/studio/inputs/reference/StudioReferenceInput'
export {
  StudioFileInput as FileInput,
  type FileInputProps,
} from '../core/form/studio/inputs/StudioFileInput'
export {
  StudioImageInput as ImageInput,
  type ImageInputProps,
} from '../core/form/studio/inputs/StudioImageInput'
// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
export {useEnhancedObjectDialog} from '../core/form/studio/tree-editing/context/enabled/useEnhancedObjectDialog'
export {
  type AssetSourcesResolver,
  type FileLike,
  type ResolvedUploader,
  type Uploader,
  type UploaderDef,
  type UploaderResolver,
  type UploadOptions,
  type UploadProgressEvent,
} from '../core/form/studio/uploads/types'
export {
  type ArrayInputFunctionsProps, // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  type FormBuilderCustomMarkersComponent,
  type FormBuilderFilterFieldFn,
  type FormBuilderInputComponentMap,
  type FormBuilderMarkersComponent, // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  type PortableTextMarker, // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  type RenderBlockActionsCallback, // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  type RenderBlockActionsProps, // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  type RenderCustomMarkers,
} from '../core/form/types/_transitional'
export {
  isArrayOfBlocksInputProps,
  isArrayOfObjectsInputProps,
  isArrayOfPrimitivesInputProps,
  isBooleanInputProps,
  isNumberInputProps,
  isObjectInputProps,
  isObjectItemProps,
  isStringInputProps,
} from '../core/form/types/asserters'
export {
  type BlockAnnotationProps,
  type BlockDecoratorProps,
  type BlockListItemProps,
  type BlockProps,
  type BlockStyleProps,
  type MarkdownConfig,
  type PortableTextPluginsProps,
} from '../core/form/types/blockProps'
export {
  type ArrayInputCopyEvent,
  type ArrayInputInsertEvent,
  type ArrayInputMoveItemEvent,
  type UploadEvent,
} from '../core/form/types/event'
export {
  type ArrayFieldProps,
  type ArrayOfPrimitivesFieldProps,
  type BaseFieldProps,
  type BooleanFieldProps, // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  type FieldCommentsProps,
  type FieldProps,
  type NumberFieldProps,
  type ObjectFieldProps,
  type PrimitiveFieldProps,
  type StringFieldProps,
} from '../core/form/types/fieldProps'
export {type FormDocumentValue} from '../core/form/types/formDocumentValue'
export {
  type ArrayOfObjectsInputProps,
  type ArrayOfPrimitivesElementType,
  type ArrayOfPrimitivesInputProps,
  type BaseInputProps,
  type BooleanInputProps,
  type ComplexElementProps,
  type EditorChange,
  type InputOnSelectFileFunctionProps,
  type InputProps,
  type NumberInputProps,
  type ObjectInputProps,
  type OnPasteFn,
  type OnPathFocusPayload,
  type PasteData,
  type PortableTextInputProps,
  type PrimitiveInputElementProps,
  type PrimitiveInputProps,
  type StringInputProps,
} from '../core/form/types/inputProps'
export {
  type BaseItemProps,
  type ItemProps,
  type ObjectItem,
  type ObjectItemProps,
  type PrimitiveItemProps,
} from '../core/form/types/itemProps'
export {
  type RenderAnnotationCallback,
  type RenderArrayOfObjectsItemCallback,
  type RenderArrayOfPrimitivesItemCallback,
  type RenderBlockCallback,
  type RenderFieldCallback,
  type RenderInputCallback,
  type RenderItemCallback,
  type RenderPreviewCallback,
  type RenderPreviewCallbackProps,
} from '../core/form/types/renderCallback'
export {useFormBuilder} from '../core/form/useFormBuilder'
export {fromMutationPatches, type MutationPatch} from '../core/form/utils/mutationPatch'
export {TransformPatches} from '../core/form/utils/TransformPatches'
// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
export {useClient} from '../core/hooks/useClient'
export {type ConnectionState} from '../core/hooks/useConnectionState'
export {useDataset} from '../core/hooks/useDataset'
export {useDateTimeFormat, type UseDateTimeFormatOptions} from '../core/hooks/useDateTimeFormat'
export {useDialogStack} from '../core/hooks/useDialogStack'
export {type DocumentIdStack} from '../core/hooks/useDocumentIdStack'
export {useDocumentOperation} from '../core/hooks/useDocumentOperation'
export {type DocumentSyncState} from '../core/hooks/useDocumentSyncState'
export {useEditState} from '../core/hooks/useEditState'
export {
  type FormattedDuration,
  useFormattedDuration,
  type UseFormattedDurationOptions,
} from '../core/hooks/useFormattedDuration'
export {type GlobalCopyPasteElementHandler} from '../core/hooks/useGlobalCopyPasteElementHandler'
export {useListFormat, type UseListFormatOptions} from '../core/hooks/useListFormat'
export {type UseManageFavoriteProps} from '../core/hooks/useManageFavorite'
export {useNumberFormat, type UseNumberFormatOptions} from '../core/hooks/useNumberFormat'
export {useProjectId} from '../core/hooks/useProjectId'
export {type DocumentField, useReferringDocuments} from '../core/hooks/useReferringDocuments'
export {type RelativeTimeOptions, useRelativeTime} from '../core/hooks/useRelativeTime'
export {useSchema} from '../core/hooks/useSchema'
export {useSetImmediateValidation} from '../core/hooks/useSetImmediateValidation'
export {type SyncState, useSyncState} from '../core/hooks/useSyncState'
export {
  type CreatableTargetDocument,
  type TargetDocumentState,
} from '../core/hooks/useTargetDocumentState'
export {type TargetScopeIdOptions} from '../core/hooks/useTargetScopeId'
export {useTemplates} from '../core/hooks/useTemplates'
// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
export {type TimeAgoOpts, useTimeAgo} from '../core/hooks/useTimeAgo'
export {useTools} from '../core/hooks/useTools'
export {
  type FormattableMeasurementUnit,
  type UnitFormatter,
  useUnitFormatter,
  type UseUnitFormatterOptions,
} from '../core/hooks/useUnitFormatter'
export {
  type UserListWithPermissionsHookValue,
  type UserListWithPermissionsOptions,
  type UserWithPermission,
  useUserListWithPermissions,
} from '../core/hooks/useUserListWithPermissions'
export {useValidationStatus} from '../core/hooks/useValidationStatus'
export {useWorkspaceSchemaId} from '../core/hooks/useWorkspaceSchemaId'
export {type StudioLocaleResourceKeys} from '../core/i18n/bundles/studio'
export {type ValidationLocaleResourceKeys} from '../core/i18n/bundles/validation'
export {InlineCode} from '../core/i18n/components/InlineCode'
export {
  defineLocale,
  defineLocaleResourceBundle, // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  defineLocalesResources,
  removeUndefinedLocaleResources,
} from '../core/i18n/helpers'
export {type I18nNode} from '../core/i18n/hooks/useI18nText'
export {useCurrentLocale} from '../core/i18n/hooks/useLocale'
export {
  useTranslation,
  type UseTranslationOptions,
  type UseTranslationResponse,
} from '../core/i18n/hooks/useTranslation'
export {Translate, type TranslateComponentMap, type TranslationProps} from '../core/i18n/Translate'
export {
  type ImplicitLocaleResourceBundle,
  type Locale,
  type LocaleConfigContext,
  type LocaleDefinition,
  type LocaleNestedResource,
  type LocalePluginOptions,
  type LocaleResourceBundle,
  type LocaleResourceKey,
  type LocaleResourceRecord,
  type LocalesBundlesOption,
  type LocalesOption,
  type LocaleSource,
  type LocaleWeekInfo,
  type StaticLocaleResourceBundle,
} from '../core/i18n/types'
export {type PerspectiveNotWriteableReason} from '../core/perspective/isPerspectiveWriteable'
export {PerspectiveProvider} from '../core/perspective/PerspectiveProvider'
export {
  type PerspectiveContextValue,
  type PerspectiveStack,
  type ReleaseId,
  type ReleasesNavMenuItemPropsGetter, // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  type SelectedPerspective,
  type TargetPerspective,
} from '../core/perspective/types'
export {useGetDefaultPerspective} from '../core/perspective/useGetDefaultPerspective'
export {getDefaultVariant} from '../core/perspective/getDefaultVariant'
export {usePerspective} from '../core/perspective/usePerspective'
export {
  DocumentPreviewPresence,
  type DocumentPreviewPresenceProps,
} from '../core/presence/DocumentPreviewPresence'
export {
  type FieldPresenceInnerProps,
  type FieldPresenceProps, // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  FieldPresenceWithOverlay,
} from '../core/presence/FieldPresence'
export {PresenceOverlay, type PresenceOverlayProps} from '../core/presence/overlay/PresenceOverlay'
export {type PresenceScopeProps} from '../core/presence/PresenceScope'
export {
  type FieldPresenceData,
  type FormNodePresence,
  type Location,
  type Position,
  type PresentUser,
  type Rect,
  type RegionWithIntersectionDetails,
  type ReportedRegionWithRect,
  type Size,
} from '../core/presence/types'
export {Preview} from '../core/preview/components/Preview'
export {
  SanityDefaultPreview,
  type SanityDefaultPreviewProps,
} from '../core/preview/components/SanityDefaultPreview'
export {
  type DocumentPreviewStore,
  type DocumentPreviewStoreOptions,
  type ObserveForPreviewFn,
} from '../core/preview/documentPreviewStore'
export {
  type ApiConfig,
  type AvailabilityReason,
  type AvailabilityResponse,
  type DocumentAvailability,
  type DocumentStackAvailability,
  type DraftsModelDocument,
  type DraftsModelDocumentAvailability,
  type FieldName,
  type Id,
  type InvalidationChannelEvent,
  type ObserveDocumentAvailabilityFn,
  type ObserveDocumentTypeFromIdFn,
  type ObservePathsFn,
  type PreparedSnapshot,
  type Previewable,
  type PreviewableType,
  type PreviewPath,
  type Selection,
} from '../core/preview/types'
export {
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  unstable_useObserveDocument,
  useUnstableObserveDocument,
} from '../core/preview/useObserveDocument'
// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
export {unstable_useValuePreview, useValuePreview} from '../core/preview/useValuePreview'
export {getPreviewStateObservable} from '../core/preview/utils/getPreviewStateObservable'
export {getPreviewValueWithFallback} from '../core/preview/utils/getPreviewValueWithFallback'
export {prepareForPreview} from '../core/preview/utils/prepareForPreview'
export {ReleaseAvatar, ReleaseAvatarIcon} from '../core/releases/components/ReleaseAvatar'
export {useDocumentVersions} from '../core/releases/hooks/useDocumentVersions'
export {useDocumentVersionTypeSortedList} from '../core/releases/hooks/useDocumentVersionTypeSortedList'
export {useIsReleaseActive} from '../core/releases/hooks/useIsReleaseActive'
export {useOnlyHasVersions} from '../core/releases/hooks/useOnlyHasVersions'
export {sortReleases} from '../core/releases/hooks/utils'
export {type VersionInfoDocumentStub} from '../core/releases/store/types'
export {useActiveReleases} from '../core/releases/store/useActiveReleases'
// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
export {useDocumentVersionInfo} from '../core/releases/store/useDocumentVersionInfo'
export {getReleaseIdFromReleaseDocumentId} from '../core/releases/util/getReleaseIdFromReleaseDocumentId'
export {RELEASES_STUDIO_CLIENT_OPTIONS} from '../core/releases/util/releasesClient'
export {getDocumentIsInPerspective} from '../core/releases/util/util'
// oxlint-disable-next-line eslint/no-restricted-imports, no-deprecated -- deprecated scheduled-publishing API stays public until it is removed
export {EditScheduleForm} from '../core/scheduled-publishing/components/editScheduleForm/EditScheduleForm'
// oxlint-disable-next-line eslint/no-restricted-imports, no-deprecated -- deprecated scheduled-publishing API stays public until it is removed
export {useScheduleAction as ScheduleAction} from '../core/scheduled-publishing/plugin/documentActions/schedule/ScheduleAction'
// oxlint-disable-next-line eslint/no-restricted-imports, no-deprecated -- deprecated scheduled-publishing API stays public until it is removed
export {ScheduledBadge} from '../core/scheduled-publishing/plugin/documentBadges/scheduled/ScheduledBadge'
export {createSchema} from '../core/schema/createSchema'
// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
export {isPerspectiveRaw} from '../core/search/common/isPerspectiveRaw'
export {
  type PartialIndexFieldPaths,
  type SearchFactoryOptions,
  type SearchOptions,
  type SearchSort,
  type SearchTerms,
} from '../core/search/common/types'
export {
  type SearchMachineContext,
  type SearchMachineEmitted,
  type SearchMachineEvent,
  type SearchMachineInput,
} from '../core/search/searchMachine'
export {
  type SearchMachineState,
  type UseSearchMachineOptions,
} from '../core/search/useSearchMachine'
export {useScheduledDraftsEnabled} from '../core/singleDocRelease/hooks/useScheduledDraftsEnabled'
export {type AgentVersionDisplay} from '../core/store/agent/useAgentVersionDisplay'
export {type RequestFailureDiagnostics} from '../core/studio/requestErrors/diagnoseRequestFailure'
export {type MockAuthStoreOptions} from '../core/store/auth/mock/createMockAuthStore'
export {getProviderTitle} from '@sanity/access-ui'
export {
  type AuthProbeResult,
  type AuthState,
  type AuthStore,
  type HandleCallbackResult,
  type LoginComponentProps,
} from '../core/store/auth/types'
export {
  type ConnectedStatus,
  type ConnectingStatus,
  type ConnectionStatus,
  type ConnectionStatusStore,
  type ConnectionStatusStoreOptions,
  type ErrorStatus,
  type RetryingStatus,
} from '../core/store/connection-status/connection-status-store'
export {
  useDocumentPreviewStore,
  useDocumentStore,
  useGrantsStore,
  useHistoryStore,
  useKeyValueStore,
  usePresenceStore,
  useProjectStore,
  useUserStore,
} from '../core/store/datastores'
export {
  type BufferedDocumentEvent,
  type BufferedDocumentWrapper,
} from '../core/store/document/buffered-doc/createBufferedDocument'
export {type CommitRequest} from '../core/store/document/buffered-doc/createObservableBufferedDocument'
export {
  type CommitFunction,
  type CommittedEvent,
  type DocumentMutationEvent,
  type DocumentRebaseEvent,
  type DocumentRemoteMutationEvent,
  type MutationPayload,
  type RemoteSnapshotEvent,
  type SnapshotEvent,
} from '../core/store/document/buffered-doc/types'
export {
  type CommitError,
  type DocumentVersion,
  type DocumentVersionEvent,
  type MutationResult,
  type Pair,
  type RemoteSnapshotVersionEvent,
  type WithVersion,
} from '../core/store/document/document-pair/checkoutPair'
export {type EditStateFor} from '../core/store/document/document-pair/editState'
export {
  type OperationError,
  type OperationSuccess,
} from '../core/store/document/document-pair/operationEvents'
export {
  type MapDocument,
  type Operation,
  type OperationArgs,
  type OperationImpl,
  type OperationsAPI,
} from '../core/store/document/document-pair/operations/types'
export {type DocumentVersionSnapshots} from '../core/store/document/document-pair/snapshotPair'
export {
  type DocumentStore,
  type DocumentStoreOptions,
  type QueryParams,
} from '../core/store/document/document-store'
export {
  type DocumentPairLoadedEvent,
  type DocumentRebaseTelemetryEvent,
  type DocumentStoreExtraOptions,
  type InitialSnapshotEvent,
  type LatencyReportEvent,
  type ListenerEvent,
  type MutationPerformanceEvent,
} from '../core/store/document/getPairListener'
export {type DocumentTypeResolveState} from '../core/store/document/hooks/useDocumentType'
export {useDocumentValues} from '../core/store/document/hooks/useDocumentValues'
export {type InitialValueOptions} from '../core/store/document/initialValue/initialValue'
export {
  type InitialValueErrorMsg,
  type InitialValueLoadingMsg,
  type InitialValueMsg,
  type InitialValueState,
  type InitialValueSuccessMsg,
} from '../core/store/document/initialValue/types'
export {type ListenQueryOptions, type ListenQueryParams} from '../core/store/document/listenQuery'
export {
  type DocumentPairTarget,
  type IdPair,
  type MutationEvent,
  type PendingMutationsEvent,
} from '../core/store/document/types'
export {useInitialValueResolverContext} from '../core/store/document/useInitialValue'
export {useResolveInitialValueForType} from '../core/store/document/useResolveInitialValueForType'
export {
  type BaseEvent,
  type CreateDocumentVersionEvent,
  type CreateLiveDocumentEvent,
  type DeleteDocumentGroupEvent,
  type DeleteDocumentVersionEvent,
  type DocumentGroupEvent,
  type DocumentVersionEventType,
  type EditDocumentVersionEvent,
  type EventsStore,
  type EventsStoreRevision,
  type HistoryClearedEvent,
  isCreateDocumentVersionEvent,
  isCreateLiveDocumentEvent,
  isDeleteDocumentGroupEvent,
  isDeleteDocumentVersionEvent,
  isEditDocumentVersionEvent,
  isNonSelectableTerminalEvent,
  isPublishDocumentVersionEvent,
  isScheduleDocumentVersionEvent,
  isUnpublishDocumentEvent,
  isUnscheduleDocumentVersionEvent,
  isUpdateLiveDocumentEvent,
  type PublishDocumentVersionEvent,
  type ScheduleDocumentVersionEvent,
  type UnpublishDocumentEvent,
  type UnscheduleDocumentVersionEvent,
  type UpdateLiveDocumentEvent,
} from '../core/store/events/types'
export {
  type DocumentPairPermissionsOptions,
  type DocumentPermission,
  getDocumentPairPermissions,
  useDocumentPairPermissions,
} from '../core/store/grants/documentPairPermissions'
export {
  type DocumentValuePermissionsOptions,
  useDocumentValuePermissions,
} from '../core/store/grants/documentValuePermissions'
export {type GrantsStoreOptions} from '../core/store/grants/grantsStore'
export {
  type TemplatePermissionsOptions,
  type TemplatePermissionsResult,
} from '../core/store/grants/templatePermissions'
export {
  type DocumentValuePermission,
  type EvaluationParams,
  type Grant,
  type GrantsStore,
  type PermissionCheckResult,
} from '../core/store/grants/types'
export {
  type DocumentRevision,
  type HistoryStore,
  type HistoryStoreOptions,
} from '../core/store/history/createHistoryStore'
/* oxlint-disable no-deprecated -- the legacy document timeline stays exported while deprecated; removing it is a breaking change deferred to the next major */
export {
  type ParsedTimeRef,
  Timeline,
  type TimelineOptions,
} from '../core/store/history/history/Timeline'
export {
  type SelectionState,
  TimelineController,
  type TimelineControllerOptions,
} from '../core/store/history/history/TimelineController'
export {
  type CombinedDocument,
  type DocumentRemoteMutationVersionEvent,
  type Transaction,
} from '../core/store/history/history/types'
export {useTimelineSelector} from '../core/store/history/useTimelineSelector'
export {
  type TimelineState,
  type TimelineStore,
  useTimelineStore,
} from '../core/store/history/useTimelineStore'
/* oxlint-enable no-deprecated */
export {type KeyValueStore, type KeyValueStoreValue} from '../core/store/key-value/types'
export {type PresenceStore} from '../core/store/presence/presence-store'
export {
  type DocumentPresence,
  type GlobalPresence,
  type PresenceLocation,
  type Session,
  type Status,
  type UserSessionPair,
} from '../core/store/presence/types'
export {useDocumentPresence} from '../core/store/presence/useDocumentPresence'
export {
  type ProjectData,
  type ProjectDatasetData,
  type ProjectGrants,
  type ProjectOrganizationData,
  type ProjectStore,
} from '../core/store/project/types'
export {type StoreRequestErrorHandler} from '../core/store/requestErrorHandler'
export {
  type ResourceCache,
  type ResourceCacheProviderProps,
} from '../core/store/ResourceCacheProvider'
export {useCurrentUser} from '../core/store/user/hooks'
export {type UserStore, type UserStoreOptions} from '../core/store/user/userStore'
export {type ActiveWorkspaceMatcherProps} from '../core/studio/activeWorkspaceMatcher/ActiveWorkspaceMatcher'
export {type ActiveWorkspaceMatcherContextValue} from '../core/studio/activeWorkspaceMatcher/ActiveWorkspaceMatcherContext'
export {
  type MatchWorkspaceOptions,
  type MatchWorkspaceResult,
} from '../core/studio/activeWorkspaceMatcher/matchWorkspace'
export {useActiveWorkspace} from '../core/studio/activeWorkspaceMatcher/useActiveWorkspace'
export {AddonDatasetProvider} from '../core/studio/addonDataset/AddonDatasetProvider'
export {type AddonDatasetContextValue} from '../core/studio/addonDataset/types'
export {useAddonDataset} from '../core/studio/addonDataset/useAddonDataset'
export {
  type ColorSchemeProviderProps, // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  useColorScheme,
  useColorSchemeOptions,
  useColorSchemeSetValue,
  useColorSchemeValue,
} from '../core/studio/colorScheme'
export {type DiagnosticsReportProps} from '../core/studio/components/navbar/resources/DiagnosticsReport'
export {type SearchPopoverProps} from '../core/studio/components/navbar/search/components/SearchPopover'
export {type SearchContextValue} from '../core/studio/components/navbar/search/contexts/search/SearchContext'
export {
  defineSearchFilter,
  defineSearchFilterOperators,
  type SearchFilterDefinition,
} from '../core/studio/components/navbar/search/definitions/filters'
export {type SearchOperatorType} from '../core/studio/components/navbar/search/definitions/operators/defaultOperators'
export {
  defineSearchOperator,
  type I18nSearchOperatorDescriptionKey,
  type I18nSearchOperatorNameKey,
  type OperatorButtonValueComponentProps,
  type OperatorInputComponentProps,
  type SearchOperatorBase,
  type SearchOperatorBuilder,
  type SearchOperatorButtonValue,
  type SearchOperatorInput,
  type SearchOperatorParams,
  type SearchValueFormatterContext,
  type ValuelessSearchOperatorBuilder,
  type ValuelessSearchOperatorParams,
} from '../core/studio/components/navbar/search/definitions/operators/operatorTypes'
export {
  type PartialIndexSettings,
  type SearchPartialIndexSettings, // oxlint-disable-next-line no-deprecated -- only the overload without field paths is deprecated
  useSearchMaxFieldDepth,
} from '../core/studio/components/navbar/search/hooks/useSearchMaxFieldDepth'
export {StudioLogo} from '../core/studio/components/navbar/StudioLogo'
export {StudioNavbar} from '../core/studio/components/navbar/StudioNavbar'
export {StudioToolMenu} from '../core/studio/components/navbar/tools/StudioToolMenu'
export {ToolLink, type ToolLinkProps} from '../core/studio/components/navbar/tools/ToolLink'
export {CopyPasteProvider, useCopyPaste} from '../core/studio/copyPaste/CopyPasteProvider'
export {
  type BaseOptions,
  type CopyOptions,
  type CopyPasteContextType,
  type DocumentMeta,
  type PasteOptions,
  type SanityClipboardItem,
} from '../core/studio/copyPaste/types'
export {type StudioDiagnostics} from '../core/studio/diagnostics/gatherStudioDiagnostics'
export {type StudioDiagnosticsBridgeApi} from '../core/studio/diagnostics/StudioDiagnosticsBridge'
export {
  generateStudioManifest,
  type GenerateStudioManifestOptions,
} from '../core/studio/manifest/generateStudioManifest'
export {
  type ManifestWorkspaceInput,
  type StudioManifest,
  type StudioWorkspaceManifest,
} from '../core/studio/manifest/types'
export {uploadSchema} from '../core/studio/manifest/uploadSchema'
// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
export {renderStudio} from '../core/studio/renderStudio'
export {
  type ConfigErrorClassification,
  isTimeoutError,
  type RequestErrorClassification,
} from '../core/studio/requestErrors/classify'
export {
  type RequestErrorChannel,
  type RequestErrorClaim,
  type RequestErrorReportOptions,
  type StudioErrorHandler,
} from '../core/studio/requestErrors/types'
export {useStudioErrorHandler} from '../core/studio/requestErrors/useStudioErrorHandler'
// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
export {type SourceProviderProps, useSource} from '../core/studio/source'
export {Studio, type StudioProps} from '../core/studio/Studio'
export {type NavbarContextValue, StudioLayout} from '../core/studio/StudioLayout'
export {StudioProvider, type StudioProviderProps} from '../core/studio/StudioProvider'
export {type UpsellDialogViewedInfo} from '../core/studio/upsell/__telemetry__/upsell.telemetry'
export {type InterpolationProp} from '../core/studio/upsell/upsellDescriptionSerializer/UpsellDescriptionSerializer'
export {useWorkspace, type WorkspaceProviderProps} from '../core/studio/workspace'
export {type ErrorMessageProps} from '../core/studio/workspaceLoader/ErrorMessage'
export {type WorkspaceLike} from '../core/studio/workspaces/types'
export {useWorkspaces} from '../core/studio/workspaces/useWorkspaces'
export {type ValidateWorkspaceOptions} from '../core/studio/workspaces/validateWorkspaces'
export {type VisibleWorkspacesContextValue} from '../core/studio/workspaces/VisibleWorkspacesProvider'
export {type WorkspacesContextValue} from '../core/studio/workspaces/WorkspacesContext'
export {
  type CorsCheckResult,
  type CorsProbeOutcome,
  type WorkspacesProviderProps,
} from '../core/studio/workspaces/WorkspacesProvider'
export {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../core/studioClient'
export {resolveInitialValue, type Serializeable} from '../core/templates/resolve'
export {
  type InitialValueTemplateItem,
  type ResolvedTemplate,
  type Template,
  type TemplateArrayFieldDefinition,
  type TemplateFieldDefinition,
  type TemplateItem,
  type TemplateParameter,
  type TemplateReferenceTarget,
  type TypeTarget,
} from '../core/templates/types'
// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
export {defaultTheme} from '../core/theme'
// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
export {buildLegacyTheme} from '../core/theme/_legacy/theme'
// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
export {type LegacyThemeProps, type LegacyThemeTints} from '../core/theme/_legacy/types'
// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
export {type StudioTheme, type StudioThemeColorSchemeKey} from '../core/theme/types'
export {useUserColor, useUserColorManager} from '../core/user-color/hooks'
export {type UserColorManagerOptions} from '../core/user-color/manager'
export {type UserColorManagerProviderProps} from '../core/user-color/provider'
export {
  type HexColor,
  type UserColor,
  type UserColorHue,
  type UserColorManager,
  type UserId,
} from '../core/user-color/types'
export {
  createHookFromObservableFactory,
  type LoadingTuple,
  type ReactHook,
} from '../core/util/createHookFromObservableFactory'
export {
  collate,
  type CollatedHit,
  documentIdEquals,
  type DraftId,
  DRAFTS_FOLDER,
  getDraftId,
  getPublishedId,
  getVersionFromId,
  getVersionId,
  isDraft,
  isDraftId,
  isPublishedId,
  isVersionId,
  type PublishedId,
  type SystemBundle,
  systemBundles,
  VERSION_FOLDER,
} from '../core/util/draftUtils'
export {type DocumentVariantType, getDocumentVariantType} from '../core/util/getDocumentVariantType'
export {getReferencePaths} from '../core/util/getReferencePaths'
export {isArray} from '../core/util/isArray'
export {isRecord} from '../core/util/isRecord'
export {isString} from '../core/util/isString'
export {type PartialExcept} from '../core/util/PartialExcept'
export {type CardinalityOneRelease, isCardinalityOneRelease} from '../core/util/releaseUtils'
export {_isType} from '../core/util/schemaUtils'
export {truncateString} from '../core/util/unicodeString'
export {
  type ErrorState,
  type LoadableState,
  type LoadedState,
  type LoadingState,
} from '../core/util/useLoadable'
export {userHasRole} from '../core/util/userHasRole'
// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
export {useUnique} from '../core/util/useUnique'
export {type StructureNodeIdValidationResult} from '../core/util/validateStructureNodeId'
export {
  isDraftVersion,
  isPublishedVersion,
  isReleaseVersion,
  isVariantVersion,
  readVersionType,
  type VersionType,
} from '../core/util/versionsUtils'
export {type ValidateDocumentOptions, validateDocument} from '../core/validation'
export {type ValidationContext} from '@sanity/validation/_internal'
export {VARIANTS_STUDIO_CLIENT_OPTIONS} from '../core/variants/store/constants'
export {getVariantTitle} from '../core/variants/tool/util'
export {type SystemVariant} from '../core/variants/types'
export {SANITY_VERSION} from '../core/version'
export {
  type ReconnectEvent,
  type ReleaseDocument,
  type ResetEvent,
  type SanityClient,
  type WelcomeBackEvent,
  type WelcomeEvent,
} from '@sanity/client'
export {type ImageUrlBuilder} from '@sanity/image-url'
export {
  DEFAULT_ANNOTATIONS,
  DEFAULT_BLOCK_STYLES,
  DEFAULT_DECORATORS,
  DEFAULT_LIST_TYPES,
} from '@sanity/schema'
export * from '@sanity/types'
export {type TFunction} from 'i18next'
