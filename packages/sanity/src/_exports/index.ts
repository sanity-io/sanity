import 'ui5/styles.css'
import '@sanity/ui/styles.css'
// oxlint-disable-next-line import/no-unassigned-import -- side effect: keeps the module augmentations declared by this module on the public type surface
import '../core/form/types/definitionExtensions'

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
export {
  type AuthConfig,
  type AuthProvider,
  type LoginMethod,
  type OAuthAuthConfig,
  type OAuthConfig,
  type LegacyAuthConfig,
} from '../core/config/auth/types'
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
export {resolveConfig} from '../core/config/resolveConfig'
export {SchemaError} from '../core/config/SchemaError'
export {
  type ActiveToolLayoutProps,
  type LayoutProps,
  type LogoProps,
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
  type FederatedAssetSourcesConfig,
  type FederatedAssetSourceViewInfo,
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
  type ReleaseMetadataConfig,
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
  type Workspace,
  type WorkspaceHiddenContext,
  type WorkspaceHiddenProperty,
  type WorkspaceOptions,
} from '../core/config/types'
export {type SendFeedbackOptions} from '../core/feedback/hooks/useInStudioFeedback'
export {
  type BaseFeedbackTags,
  type DynamicFeedbackTags,
  type FeedbackPayload,
  type TagValue,
} from '../core/feedback/types'
export {
  type Annotation,
  type AnnotationDetails,
  type Chunk,
  type ChunkType,
} from '../core/field/types'

export {useFormValue} from '../core/form/contexts/FormValue'
export {useGetFormValue} from '../core/form/contexts/GetFormValue'
export {type FormBuilderContextValue} from '../core/form/FormBuilderContext'
// Code-split facades. Same names and props; the implementation loads on first render so the
// form runtime and the Portable Text editor are not in the login screen's import graph.

export {type DateInputProps} from '../core/form/inputs/DateInputs/DateInput'
export {type DateTimeInputProps} from '../core/form/inputs/DateInputs/DateTimeInput'
export {type EmailInputProps} from '../core/form/inputs/EmailInput'
export {type AssetAccessPolicy} from '../core/form/inputs/files/types'
export {type SlugInputProps} from '../core/form/inputs/Slug/SlugInput'
export {type TagsArrayInputProps} from '../core/form/inputs/TagsArrayInput'
export {type TelephoneInputProps} from '../core/form/inputs/TelephoneInput'
export {type TextInputProps} from '../core/form/inputs/TextInput'
export {type UrlInputProps} from '../core/form/inputs/UrlInput'
export {type MemberItemProps} from '../core/form/members/array/items/ArrayOfObjectsItem'
export {type PrimitiveMemberItemProps} from '../core/form/members/array/items/ArrayOfPrimitivesItem'
export {dec, diffMatchPatch, inc, insert, set, setIfMissing, unset} from '../core/form/patch/patch'
export {
  type MutationPatchMsg,
  type PatchChannel,
  type PatchMsg,
  type PatchMsgSubscriber,
  type RebasePatchMsg,
} from '../core/form/patch/PatchChannel'
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
export {type FormBuilderProps} from '../core/form/studio/FormBuilder'
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
// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
export {useClient} from '../core/hooks/useClient'
export {useDataset} from '../core/hooks/useDataset'
export {useDateTimeFormat, type UseDateTimeFormatOptions} from '../core/hooks/useDateTimeFormat'
export {
  type FormattedDuration,
  useFormattedDuration,
  type UseFormattedDurationOptions,
} from '../core/hooks/useFormattedDuration'
export {useListFormat, type UseListFormatOptions} from '../core/hooks/useListFormat'
export {useNumberFormat, type UseNumberFormatOptions} from '../core/hooks/useNumberFormat'
export {useProjectId} from '../core/hooks/useProjectId'
export {type DocumentField, useReferringDocuments} from '../core/hooks/useReferringDocuments'
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
} from '../core/hooks/useUserListWithPermissions'
export {type StudioLocaleResourceKeys} from '../core/i18n/bundles/studio'
export {type ValidationLocaleResourceKeys} from '../core/i18n/bundles/validation'
export {
  type UseTranslationOptions,
  type UseTranslationResponse,
} from '../core/i18n/hooks/useTranslation'
export {type TranslateComponentMap, type TranslationProps} from '../core/i18n/Translate'
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
export {
  type PerspectiveContextValue,
  type PerspectiveStack,
  type ReleaseId,
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  type SelectedPerspective,
  type TargetPerspective,
} from '../core/perspective/types'
export {usePerspective} from '../core/perspective/usePerspective'
export {type FormNodePresence} from '../core/presence/types'
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
export {createSchema} from '../core/schema/createSchema'
export {
  type AuthProbeResult,
  type AuthState,
  type AuthStore,
  type LoginComponentProps,
} from '../core/store/auth/types'
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
export {type InitialValueOptions} from '../core/store/document/initialValue/initialValue'
export {
  type InitialValueErrorMsg,
  type InitialValueLoadingMsg,
  type InitialValueMsg,
  type InitialValueSuccessMsg,
} from '../core/store/document/initialValue/types'
export {type ListenQueryOptions} from '../core/store/document/listenQuery'
export {type DocumentPairPermissionsListener} from '../core/store/document/types'
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
export {
  type DocumentValuePermission,
  type GrantsStore,
  type PermissionCheckResult,
} from '../core/store/grants/types'
export {type DocumentRevision, type HistoryStore} from '../core/store/history/createHistoryStore'
export {type PresenceStore} from '../core/store/presence/presence-store'
export {
  type ProjectData,
  type ProjectDatasetData,
  type ProjectGrants,
  type ProjectOrganizationData,
  type ProjectStore,
} from '../core/store/project/types'
export {useCurrentUser} from '../core/store/user/hooks'
export {type UserStore} from '../core/store/user/userStore'
export {type AddonDatasetContextValue} from '../core/studio/addonDataset/types'
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
export {type ToolLinkProps} from '../core/studio/components/navbar/tools/ToolLink'
export {
  type BaseOptions,
  type CopyOptions,
  type CopyPasteContextType,
  type DocumentMeta,
  type PasteOptions,
  type SanityClipboardItem,
} from '../core/studio/copyPaste/types'
export {generateStudioManifest} from '../core/studio/manifest/generateStudioManifest'
export {uploadSchema} from '../core/studio/manifest/uploadSchema'
// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
export {renderStudio} from '../core/studio/renderStudio'
export {
  type RequestErrorReportOptions,
  type StudioErrorHandler,
} from '../core/studio/requestErrors/types'
export {type StudioProps} from '../core/studio/Studio'
export {type StudioProviderProps} from '../core/studio/StudioProvider'
export {useWorkspace} from '../core/studio/workspace'
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
export {type LegacyThemeProps} from '../core/theme/_legacy/types'
// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
export {type StudioTheme, type StudioThemeColorSchemeKey} from '../core/theme/types'
export {type DraftId, type PublishedId, type SystemBundle} from '../core/util/draftUtils'
export {type DocumentVariantType} from '../core/util/getDocumentVariantType'
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
export type * from '@sanity/types'
export * from './reexports/sanityTypes.runtime'
export {type TFunction} from 'i18next'

// <tombstones-pending-sapp-5036>
// Pending type-only tombstones for SAPP-5036. Slot into tombstones/manifest.json (SAPP-5034 / #16525)
// once that PR merges, then delete this block and regenerate. Never emit runtime JS.
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const ALL_FIELDS_GROUP: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const AddonDatasetProvider: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const ArrayOfObjectOptionsInput: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const ArrayOfObjectsFunctions: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const ArrayOfObjectsItem: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const ArrayOfOptionsInput: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const ArrayOfPrimitiveOptionsInput: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const ArrayOfPrimitivesFunctions: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const ArrayOfPrimitivesInput: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const ArrayOfPrimitivesItem: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const AvatarSkeleton: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const BlockEditor: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const BlockImagePreview: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type BlockImagePreviewProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const BlockPreview: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const BooleanInput: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const ChangeIndicator: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ChangeIndicatorProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const ChangeList: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ChangeListProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const CircularProgress: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const CompactPreview: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type CompactPreviewProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const CopyPasteProvider: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const CrossDatasetReferenceInput: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const DEFAULT_ANNOTATIONS: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const DEFAULT_BLOCK_STYLES: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const DEFAULT_DECORATORS: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const DEFAULT_LIST_TYPES: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const DEFAULT_STUDIO_CLIENT_OPTIONS: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const DRAFTS_FOLDER: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const DateInput: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const DateTimeInput: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const DefaultPreview: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type DefaultPreviewProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const DetailPreview: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type DetailPreviewProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const DiffCard: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type DiffCardProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const DiffFromTo: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type DiffFromToProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const DiffTooltip: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type DiffTooltipProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type DiffTooltipWithAnnotationsProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const DocumentPreviewPresence: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type DocumentPreviewPresenceProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const DocumentStatus: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const DocumentStatusIndicator: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const EditPortal: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const EmailInput: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const EnhancedObjectDialog: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const FileInput: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const FormBuilder: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const FormCallbacksProvider: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const FormField: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const FormFieldHeaderText: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type FormFieldHeaderTextProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type FormFieldProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const FormFieldValidationStatus: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type FormFieldValidationStatusProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const FormInput: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const FormProvider: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const Hotkeys: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type HotkeysProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const ImageInput: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const InlinePreview: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type InlinePreviewProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const InsufficientPermissionsMessage: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type InsufficientPermissionsMessageProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const IntentButton: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const LinearProgress: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const MEDIA_LIBRARY_ASSET_ASPECT_TYPE_NAME: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const MediaPreview: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type MediaPreviewProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type RovingFocusNavigationType = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type RovingFocusProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type StatusButtonProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type UserAvatarProps = never
// </tombstones-pending-sapp-5036>
