import 'ui5/styles.css'
import '@sanity/ui/styles.css'
// oxlint-disable-next-line import/no-unassigned-import -- side effect: keeps the module augmentations declared by this module on the public type surface
import '../core/form/types/definitionExtensions'

export {ChangeIndicator} from '../core/changeIndicators/ChangeIndicator'
export {type CommentsIntentProviderProps} from '../core/comments/context/intent/CommentsIntentProvider'
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
} from '../core/comments/types'
// oxlint-disable-next-line no-deprecated -- preserved for backwards compatibility
export {DocumentStatus} from '../core/components/documentStatus/DocumentStatus'
// oxlint-disable-next-line no-deprecated -- preserved for backwards compatibility
export {DocumentStatusIndicator} from '../core/components/documentStatusIndicator/DocumentStatusIndicator'
export {
  type GetHookCollectionStateProps,
  type HookCollectionActionHook,
} from '../core/components/hookCollection/types'
export {type HotkeysProps} from '../core/components/Hotkeys'
export {InsufficientPermissionsMessage} from '../core/components/InsufficientPermissionsMessage'
export {IntentButton} from '../core/components/IntentButton'
export {PreviewCard} from '../core/components/previewCard/PreviewCard'
export {type CompactPreviewProps} from '../core/components/previews/general/CompactPreview'
export {
  DefaultPreview,
  type DefaultPreviewProps,
} from '../core/components/previews/general/DefaultPreview'
export {type DetailPreviewProps} from '../core/components/previews/general/DetailPreview'
export {type MediaPreviewProps} from '../core/components/previews/general/MediaPreview'
export {type BlockImagePreviewProps} from '../core/components/previews/portableText/BlockImagePreview'
export {type InlinePreviewProps} from '../core/components/previews/portableText/InlinePreview'
export {type TemplatePreviewProps} from '../core/components/previews/template/TemplatePreview'
export {
  type GeneralDocumentListLayoutKey,
  type GeneralPreviewLayoutKey,
  type PortableTextPreviewLayoutKey,
  type PreviewComponent,
  type PreviewLayoutKey,
  type PreviewMediaDimensions,
  type PreviewProps,
} from '../core/components/previews/types'
export {LinearProgress} from '../core/components/progress/LinearProgress'
export {
  type RovingFocusNavigationType,
  type RovingFocusProps,
} from '../core/components/rovingFocus/types'
export {StatusButton, type StatusButtonProps} from '../core/components/StatusButton'
export {TextWithTone} from '../core/components/textWithTone/TextWithTone'
export {UserAvatar, type UserAvatarProps} from '../core/components/userAvatar/UserAvatar'
// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
export {WithReferringDocuments} from '../core/components/WithReferringDocuments'
export {type AuthConfig, type AuthProvider, type LoginMethod} from '../core/config/auth/types'
// oxlint-disable-next-line no-deprecated -- preserved for backwards compatibility
export {createConfig, defineConfig} from '../core/config/defineConfig'
// oxlint-disable-next-line no-deprecated -- preserved for backwards compatibility
export {createPlugin, definePlugin, type PluginFactory} from '../core/config/definePlugin'
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
export {
  type ActiveToolLayoutProps,
  type LayoutProps,
  type LogoProps,
  type NavbarProps,
  type StudioComponents,
  type StudioComponentsPluginOptions,
  type ToolMenuProps,
} from '../core/config/studio/types'
export {
  type ActionComponent,
  type AppsOptions,
  type AssetSourceResolver,
  type AsyncComposableOption,
  type BaseActionDescription,
  type ComposableOption,
  type Config,
  type ConfigContext,
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
  type DocumentPluginOptions,
  type GroupableActionDescription,
  type MediaLibraryConfig,
  type MissingConfigFile,
  type NewDocumentCreationContext,
  type NewDocumentOptionsContext,
  type NewDocumentOptionsResolver,
  type PartialContext,
  type Plugin,
  type PluginOptions,
  type ReleaseActionsResolver,
  type ResolveProductionUrlContext,
  type SanityFormConfig,
  type ScheduledPublishingPluginOptions,
  type SchemaPluginOptions,
  type SingleWorkspace,
  type Source,
  type SourceClientOptions,
  type SourceOptions,
  type TemplateResolver,
  type Tool,
  type Workspace,
  type WorkspaceHiddenContext,
  type WorkspaceHiddenProperty,
  type WorkspaceOptions,
} from '../core/config/types'
export {isDev} from '../core/environment'
export {type SendFeedbackOptions} from '../core/feedback/hooks/useInStudioFeedback'
export {
  type BaseFeedbackTags,
  type DynamicFeedbackTags,
  type FeedbackPayload,
  type TagValue,
} from '../core/feedback/types'
export {getDiffAtPath} from '../core/field/diff/annotations/helpers'
export {useAnnotationColor, useDiffAnnotationColor} from '../core/field/diff/annotations/hooks'
export {ChangeList} from '../core/field/diff/components/ChangeList'
export {DiffCard} from '../core/field/diff/components/DiffCard'
export {DiffFromTo} from '../core/field/diff/components/DiffFromTo'
export {DiffTooltip} from '../core/field/diff/components/DiffTooltip'
export {pathsAreEqual, pathToString, stringToPath} from '../core/field/paths/helpers'
export {
  type Annotation,
  type AnnotationDetails,
  type Chunk,
  type ChunkType,
  type DiffComponent,
  type DiffProps,
  type ObjectDiff,
} from '../core/field/types'
export {FormField} from '../core/form/components/formField/FormField'
export {FormFieldHeaderText} from '../core/form/components/formField/FormFieldHeaderText'
export {FormFieldValidationStatus} from '../core/form/components/formField/FormFieldValidationStatus'
export {FormInput} from '../core/form/components/FormInput'
export {useFormValue} from '../core/form/contexts/FormValue'
export {useGetFormValue} from '../core/form/contexts/GetFormValue'
export {type FormBuilderContextValue} from '../core/form/FormBuilderContext'
export {ArrayOfObjectsFunctions} from '../core/form/inputs/arrays/ArrayOfObjectsInput/ArrayOfObjectsFunctions'
export {VirtualizerScrollInstanceProvider} from '../core/form/inputs/arrays/ArrayOfObjectsInput/List/VirtualizerScrollInstanceProvider'
export {type DateInputProps} from '../core/form/inputs/DateInputs/DateInput'
export {type DateTimeInputProps} from '../core/form/inputs/DateInputs/DateTimeInput'
export {type EmailInputProps} from '../core/form/inputs/EmailInput'
export {type AssetAccessPolicy} from '../core/form/inputs/files/types'
export {
  PortableTextInput as BlockEditor,
  PortableTextInput,
} from '../core/form/inputs/PortableText/PortableTextInput'
export {type SlugInputProps} from '../core/form/inputs/Slug/SlugInput'
export {type TagsArrayInputProps} from '../core/form/inputs/TagsArrayInput'
export {type TelephoneInputProps} from '../core/form/inputs/TelephoneInput'
export {TextInput, type TextInputProps} from '../core/form/inputs/TextInput'
export {type UrlInputProps} from '../core/form/inputs/UrlInput'
export {
  ArrayOfObjectsItem,
  type MemberItemProps,
} from '../core/form/members/array/items/ArrayOfObjectsItem'
export {type PrimitiveMemberItemProps} from '../core/form/members/array/items/ArrayOfPrimitivesItem'
export {MemberItemError} from '../core/form/members/array/MemberItemError'
export {MemberField} from '../core/form/members/object/MemberField'
export {MemberFieldError} from '../core/form/members/object/MemberFieldError'
export {ObjectInputMember} from '../core/form/members/object/ObjectInputMember'
export {dec, diffMatchPatch, inc, insert, set, setIfMissing, unset} from '../core/form/patch/patch'
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
export {FormCallbacksProvider, useFormCallbacks} from '../core/form/studio/contexts/FormCallbacks'
export {FormBuilder, type FormBuilderProps} from '../core/form/studio/FormBuilder'
export {type FormProviderProps} from '../core/form/studio/FormProvider'
export {type StudioCrossDatasetReferenceInputProps as CrossDatasetReferenceInputProps} from '../core/form/studio/inputs/crossDatasetReference/StudioCrossDatasetReferenceInput'
export {type StudioReferenceInputProps as ReferenceInputProps} from '../core/form/studio/inputs/reference/StudioReferenceInput'
export {type FileInputProps} from '../core/form/studio/inputs/StudioFileInput'
export {type ImageInputProps} from '../core/form/studio/inputs/StudioImageInput'
export {
  type AssetSourcesResolver,
  type FileLike,
  type ResolvedUploader,
  type Uploader,
  type UploaderResolver,
  type UploadOptions,
  type UploadProgressEvent,
} from '../core/form/studio/uploads/types'
export {
  type ArrayInputFunctionsProps,
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  type FormBuilderCustomMarkersComponent,
  type FormBuilderInputComponentMap,
  type FormBuilderMarkersComponent,
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  type PortableTextMarker,
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  type RenderBlockActionsCallback,
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  type RenderBlockActionsProps,
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  type RenderCustomMarkers,
} from '../core/form/types/_transitional'
export {
  isArrayOfObjectsInputProps,
  isObjectInputProps,
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
  type BooleanFieldProps,
  type FieldProps,
  type NumberFieldProps,
  type ObjectFieldProps,
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
export {fromMutationPatches} from '../core/form/utils/mutationPatch'
// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
export {useClient} from '../core/hooks/useClient'
export {useDataset} from '../core/hooks/useDataset'
export {type UseDateTimeFormatOptions} from '../core/hooks/useDateTimeFormat'
export {useDocumentOperation} from '../core/hooks/useDocumentOperation'
export {useEditState} from '../core/hooks/useEditState'
export {
  type FormattedDuration,
  useFormattedDuration,
  type UseFormattedDurationOptions,
} from '../core/hooks/useFormattedDuration'
export {useListFormat, type UseListFormatOptions} from '../core/hooks/useListFormat'
export {type UseNumberFormatOptions} from '../core/hooks/useNumberFormat'
export {useProjectId} from '../core/hooks/useProjectId'
export {type DocumentField} from '../core/hooks/useReferringDocuments'
export {useRelativeTime} from '../core/hooks/useRelativeTime'
export {useSchema} from '../core/hooks/useSchema'
export {useSyncState} from '../core/hooks/useSyncState'
export {useTemplates} from '../core/hooks/useTemplates'
// oxlint-disable-next-line no-deprecated -- preserved for backwards compatibility
export {useTimeAgo} from '../core/hooks/useTimeAgo'
export {useTools} from '../core/hooks/useTools'
export {
  type FormattableMeasurementUnit,
  type UnitFormatter,
  type UseUnitFormatterOptions,
} from '../core/hooks/useUnitFormatter'
export {
  type UserListWithPermissionsHookValue,
  type UserListWithPermissionsOptions,
  type UserWithPermission,
} from '../core/hooks/useUserListWithPermissions'
export {useValidationStatus} from '../core/hooks/useValidationStatus'
export {useWorkspaceSchemaId} from '../core/hooks/useWorkspaceSchemaId'
export {type StudioLocaleResourceKeys} from '../core/i18n/bundles/studio'
export {type ValidationLocaleResourceKeys} from '../core/i18n/bundles/validation'
export {defineLocale, defineLocaleResourceBundle} from '../core/i18n/helpers'
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
export {PerspectiveProvider} from '../core/perspective/PerspectiveProvider'
export {
  type PerspectiveContextValue,
  type PerspectiveStack,
  type ReleaseId,
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  type SelectedPerspective,
  type TargetPerspective,
} from '../core/perspective/types'
export {usePerspective} from '../core/perspective/usePerspective'
export {DocumentPreviewPresence} from '../core/presence/DocumentPreviewPresence'
export {PresenceOverlay} from '../core/presence/overlay/PresenceOverlay'
export {type FormNodePresence} from '../core/presence/types'
export {Preview} from '../core/preview/components/Preview'
export {SanityDefaultPreview} from '../core/preview/components/SanityDefaultPreview'
export {
  type DocumentPreviewStore,
  type ObserveForPreviewFn,
} from '../core/preview/documentPreviewStore'
export {
  type ApiConfig,
  type DocumentAvailability,
  type DocumentStackAvailability,
  type DraftsModelDocument,
  type DraftsModelDocumentAvailability,
  type FieldName,
  type InvalidationChannelEvent,
  type ObserveDocumentAvailabilityFn,
  type ObservePathsFn,
  type PreparedSnapshot,
  type Previewable,
  type PreviewableType,
  type PreviewPath,
} from '../core/preview/types'
export {getPreviewStateObservable} from '../core/preview/utils/getPreviewStateObservable'
export {getPreviewValueWithFallback} from '../core/preview/utils/getPreviewValueWithFallback'
// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
export {useDocumentVersionInfo} from '../core/releases/store/useDocumentVersionInfo'
export {getReleaseIdFromReleaseDocumentId} from '../core/releases/util/getReleaseIdFromReleaseDocumentId'
// oxlint-disable-next-line eslint/no-restricted-imports, no-deprecated -- deprecated scheduled-publishing API stays public until it is removed
export {useScheduleAction as ScheduleAction} from '../core/scheduled-publishing/plugin/documentActions/schedule/ScheduleAction'
// oxlint-disable-next-line eslint/no-restricted-imports, no-deprecated -- deprecated scheduled-publishing API stays public until it is removed
export {ScheduledBadge} from '../core/scheduled-publishing/plugin/documentBadges/scheduled/ScheduledBadge'
export {createSchema} from '../core/schema/createSchema'
export {getProviderTitle} from '@sanity/access-ui'
export {
  type AuthProbeResult,
  type AuthState,
  type AuthStore,
  type LoginComponentProps,
} from '../core/store/authStore/types'
export {useDocumentPreviewStore, useDocumentStore, useUserStore} from '../core/store/datastores'
export {type BufferedDocumentEvent} from '../core/store/document/buffered-doc/createBufferedDocument'
export {
  type CommittedEvent,
  type DocumentMutationEvent,
  type DocumentRebaseEvent,
  type DocumentRemoteMutationEvent,
  type MutationPayload,
  type RemoteSnapshotEvent,
  type SnapshotEvent,
} from '../core/store/document/buffered-doc/types'
export {
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
export {type MapDocument} from '../core/store/document/document-pair/operations/types'
export {type DocumentStore, type QueryParams} from '../core/store/document/document-store'
export {useDocumentValues} from '../core/store/document/hooks/useDocumentValues'
export {type InitialValueOptions} from '../core/store/document/initialValue/initialValue'
export {
  type InitialValueErrorMsg,
  type InitialValueLoadingMsg,
  type InitialValueMsg,
  type InitialValueSuccessMsg,
} from '../core/store/document/initialValue/types'
export {type ListenQueryOptions, type ListenQueryParams} from '../core/store/document/listenQuery'
export {useResolveInitialValueForType} from '../core/store/document/useResolveInitialValueForType'
export {
  type BaseEvent,
  type CreateDocumentVersionEvent,
  type CreateLiveDocumentEvent,
  type DeleteDocumentGroupEvent,
  type DeleteDocumentVersionEvent,
  type DocumentGroupEvent,
  type EditDocumentVersionEvent,
  type EventsStoreRevision,
  type HistoryClearedEvent,
  type PublishDocumentVersionEvent,
  type ScheduleDocumentVersionEvent,
  type UnpublishDocumentEvent,
  type UnscheduleDocumentVersionEvent,
  type UpdateLiveDocumentEvent,
} from '../core/store/events/types'
export {useDocumentPairPermissions} from '../core/store/grants/documentPairPermissions'
export {
  type DocumentValuePermission,
  type GrantsStore,
  type PermissionCheckResult,
} from '../core/store/grants/types'
export {type DocumentRevision, type HistoryStore} from '../core/store/history/createHistoryStore'
export {
  // oxlint-disable-next-line no-deprecated -- the legacy document timeline stays exported while deprecated; removing it is a breaking change deferred to the next major
  type ParsedTimeRef,
  // oxlint-disable-next-line no-deprecated -- the legacy document timeline stays exported while deprecated; removing it is a breaking change deferred to the next major
  type TimelineOptions,
} from '../core/store/history/history/Timeline'
export {
  // oxlint-disable-next-line no-deprecated -- the legacy document timeline stays exported while deprecated; removing it is a breaking change deferred to the next major
  type SelectionState,
  // oxlint-disable-next-line no-deprecated -- the legacy document timeline stays exported while deprecated; removing it is a breaking change deferred to the next major
  type TimelineControllerOptions,
} from '../core/store/history/history/TimelineController'
export {
  // oxlint-disable-next-line no-deprecated -- the legacy document timeline stays exported while deprecated; removing it is a breaking change deferred to the next major
  type CombinedDocument,
  // oxlint-disable-next-line no-deprecated -- the legacy document timeline stays exported while deprecated; removing it is a breaking change deferred to the next major
  type DocumentRemoteMutationVersionEvent,
  // oxlint-disable-next-line no-deprecated -- the legacy document timeline stays exported while deprecated; removing it is a breaking change deferred to the next major
  type Transaction,
} from '../core/store/history/history/types'
export {type PresenceStore} from '../core/store/presence/presence-store'
export {useDocumentPresence} from '../core/store/presence/useDocumentPresence'
export {
  type ProjectData,
  type ProjectDatasetData,
  type ProjectGrants,
  type ProjectOrganizationData,
  type ProjectStore,
} from '../core/store/project/types'
export {useCurrentUser} from '../core/store/user/hooks'
export {type UserStore} from '../core/store/user/userStore'
export {useActiveWorkspace} from '../core/studio/activeWorkspaceMatcher/useActiveWorkspace'
export {type AddonDatasetContextValue} from '../core/studio/addonDataset/types'
export {useColorSchemeValue} from '../core/studio/colorScheme'
export {type SearchFilterDefinition} from '../core/studio/components/navbar/search/definitions/filters'
export {type SearchOperatorType} from '../core/studio/components/navbar/search/definitions/operators/defaultOperators'
export {
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
export {ToolLink, type ToolLinkProps} from '../core/studio/components/navbar/tools/ToolLink'
export {
  type BaseOptions,
  type CopyOptions,
  type CopyPasteContextType,
  type DocumentMeta,
  type PasteOptions,
  type SanityClipboardItem,
} from '../core/studio/copyPaste/types'
export {type StudioManifest} from '../core/studio/manifest/types'
// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
export {renderStudio} from '../core/studio/renderStudio'
export {isTimeoutError} from '../core/studio/requestErrors/classify'
export {
  type RequestErrorReportOptions,
  type StudioErrorHandler,
} from '../core/studio/requestErrors/types'
export {useStudioErrorHandler} from '../core/studio/requestErrors/useStudioErrorHandler'
export {Studio, type StudioProps} from '../core/studio/Studio'
export {StudioLayout} from '../core/studio/StudioLayout'
export {StudioProvider, type StudioProviderProps} from '../core/studio/StudioProvider'
export {useWorkspace} from '../core/studio/workspace'
export {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../core/studioClient'
export {
  type InitialValueTemplateItem,
  type Template,
  type TemplateArrayFieldDefinition,
  type TemplateFieldDefinition,
  type TemplateItem,
  type TemplateParameter,
  type TemplateReferenceTarget,
  type TypeTarget,
} from '../core/templates/types'
// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
export {buildLegacyTheme} from '../core/theme/_legacy/theme'
// oxlint-disable-next-line no-deprecated -- preserved for backwards compatibility
export {type LegacyThemeProps} from '../core/theme/_legacy/types'
// oxlint-disable-next-line no-deprecated -- preserved for backwards compatibility
export {type StudioTheme, type StudioThemeColorSchemeKey} from '../core/theme/types'
export {useUserColorManager} from '../core/user-color/hooks'
export {createHookFromObservableFactory} from '../core/util/createHookFromObservableFactory'
export {
  collate,
  type DraftId,
  DRAFTS_FOLDER,
  getDraftId,
  getPublishedId,
  getVersionFromId,
  getVersionId,
  isDraftId,
  isPublishedId,
  isVersionId,
  type PublishedId,
  type SystemBundle,
  VERSION_FOLDER,
} from '../core/util/draftUtils'
export {type DocumentVariantType} from '../core/util/getDocumentVariantType'
export {isRecord} from '../core/util/isRecord'
export {truncateString} from '../core/util/unicodeString'
export {userHasRole} from '../core/util/userHasRole'
export {type VersionType} from '../core/util/versionsUtils'
export {type ValidateDocumentOptions, validateDocument} from '../core/validation'
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
