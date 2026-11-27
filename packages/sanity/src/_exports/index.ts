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

// <tombstones>
// Generated by tombstones/generate.mjs from tombstones/manifest.json — do not edit by hand.
// Type-only: every symbol is `export declare` / `export type … = never`. Nothing here may
// emit runtime JavaScript. See AGENTS.md ("Export tombstones (v7)").
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const ALL_FIELDS_GROUP: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const ActiveWorkspaceMatcher: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ActiveWorkspaceMatcherContextValue = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ActiveWorkspaceMatcherProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const AddonDatasetProvider: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type AgentVersionDisplay = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ArrayDiff = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ArrayItemMetadata = never
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
export declare const ArrayOfObjectsInput: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const ArrayOfObjectsInputMember: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const ArrayOfObjectsInputMembers: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ArrayOfObjectsInputMembersProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const ArrayOfObjectsItem: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ArrayOfObjectsMemberProps = never
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
export type AsyncConfigPropertyReducer = never
/**
 * @deprecated Removed in v7 with `createAuthStore`. Pass the same options on the workspace `auth` config key.
 */
export type AuthStoreOptions = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const AutoCollapseMenu: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type AvailabilityReason = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type AvailabilityResponse = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const AvatarSkeleton: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const BetaBadge: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type BetaBadgeProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type BetaFeatures = never
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
export type BooleanDiff = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const BooleanInput: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type BufferedDocumentWrapper = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const COMMENTS_INSPECTOR_NAME: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const CONNECTING: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const CONTENT_RELEASES_TIME_ZONE_SCOPE: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const CapabilityGate: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type CardinalityOneRelease = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const ChangeBreadcrumb: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const ChangeConnectorRoot: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ChangeConnectorRootProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const ChangeFieldWrapper: never
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
export type ChangeIndicatorTrackerContextValue = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const ChangeIndicatorsTracker: never
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
export type ChangeNode = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const ChangeResolver: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ChangeResolverProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ChangeTitlePath = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const ChangeTitleSegment: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const ChangesError: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const Chip: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const CircularProgress: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const CollapseMenu: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const CollapseMenuButton: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type CollapseMenuButtonProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type CollapseMenuProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type CollatedHit = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const ColorSchemeCustomProvider: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const ColorSchemeLocalStorageProvider: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const ColorSchemeProvider: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ColorSchemeProviderProps = never
/**
 * @deprecated Removed in v7 with the legacy document history timeline. Document history always uses the events API: `useEventsStore` and `EventsStore` from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver` (`@internal`, can change or disappear in any release).
 */
export type CombinedDocument = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const CommandList: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type CommandListElementType = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type CommandListGetItemDisabledCallback = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type CommandListGetItemKeyCallback = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type CommandListGetItemSelectedCallback = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type CommandListHandle = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type CommandListItemContext = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type CommandListProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type CommandListRenderItemCallback = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const CommentDeleteDialog: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const CommentDisabledIcon: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const CommentInlineHighlightSpan: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const CommentInput: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type CommentInputHandle = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type CommentInputProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const CommentsAuthoringPathProvider: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const CommentsEnabledProvider: never
/**
 * @deprecated Removed in v7. Comments API is the default; use `CommentsEnabledProvider` from `sanity`. For the add-on dataset escape hatch, set `comments: {legacy: true}` and use the `Legacy` exports from `sanity`.
 */
export declare const CommentsEnabledProviderV2: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const CommentsIntentProvider: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const CommentsList: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const CommentsProvider: never
/**
 * @deprecated Removed in v7. Comments API is the default; use `CommentsProvider` from `sanity`. For the add-on dataset escape hatch, set `comments: {legacy: true}` and use the `Legacy` exports from `sanity`.
 */
export declare const CommentsProviderV2: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type CommentsSelectedPath = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const CommentsSelectedPathProvider: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type CommitError = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type CommitFunction = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type CommitRequest = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type CommonProps = never
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
export declare const ConcreteRuleClass: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ConfigErrorClassification = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const ConfigErrorGate: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const ConfigPropertyError: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ConfigPropertyErrorOptions = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ConfigPropertyReducer = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const ConfigResolutionError: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ConfigResolutionErrorOptions = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ConnectedStatus = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ConnectingStatus = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ConnectionState = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ConnectionStatus = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ConnectionStatusStore = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ConnectionStatusStoreOptions = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ConnectorContextValue = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const ContextMenuButton: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type CookielessCompatibleLoginMethod = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const CopyPasteProvider: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type CorsCheckResult = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const CorsOriginErrorScreen: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type CorsProbeOutcome = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type CreatableTargetDocument = never
/**
 * @deprecated Removed in v7 with `createAuthStore`. Pass the same options on the workspace `auth` config key.
 */
export type CreateAuthStoreOptions = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const CreateReferenceButton: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type CreateReferenceOption = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type CreateWorkspaceFromConfigOptions = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const CrossDatasetReferenceInput: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const CrossDatasetReferencePreview: never
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
export declare const DEFAULT_MAX_RECURSION_DEPTH: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const DEFAULT_STUDIO_CLIENT_OPTIONS: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const DEFAULT_VARIANT_TYPE_KEY: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const DRAFTS_FOLDER: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const DashboardLink: never
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
export declare const Delay: never
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
export declare const DiagnosticsReport: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type DiagnosticsReportProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type Diff = never
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
export type DiffComponent = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type DiffComponentOptions = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type DiffComponentResolver = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const DiffErrorBoundary: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type DiffErrorBoundaryProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type DiffErrorBoundaryState = never
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
export declare const DiffInspectWrapper: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type DiffInspectWrapperProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type DiffProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const DiffString: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const DiffStringSegment: never
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
export type DiffVisitor = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const DivergencesProvider: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type DocumentChangeContextInstance = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type DocumentFormNode = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const DocumentGroupInventory: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type DocumentGroupInventoryComponents = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const DocumentGroupInventoryFeedbackAction: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type DocumentGroupInventoryFeedbackActionProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type DocumentGroupInventoryHandle = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type DocumentGroupInventoryPerspectiveList = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type DocumentGroupInventoryProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type DocumentGroupInventoryReferencePreviewLinkProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type DocumentIdStack = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type DocumentLayoutProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type DocumentPairLoadedEvent = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type DocumentPairPermissionsOptions = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type DocumentPairTarget = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type DocumentPermission = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type DocumentPresence = never
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
export type DocumentPreviewStoreOptions = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type DocumentRebaseTelemetryEvent = never
/**
 * @deprecated Removed in v7 with the legacy document history timeline. Document history always uses the events API: `useEventsStore` and `EventsStore` from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver` (`@internal`, can change or disappear in any release).
 */
export type DocumentRemoteMutationVersionEvent = never
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
export type DocumentStoreExtraOptions = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type DocumentStoreOptions = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type DocumentSyncState = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type DocumentTypeResolveState = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type DocumentValuePermissionsOptions = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type DocumentVersionEventType = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const DocumentVersionIcons: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type DocumentVersionSnapshots = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const DocumentVersionsStatus: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const DocumentVersionsStatusIndicator: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const EMPTY_ARRAY: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const EMPTY_OBJECT: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const EditPortal: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type EditReferenceLinkComponentProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type EditReferenceOptions = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const EditScheduleForm: never
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
export declare const ErrorActions: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ErrorActionsProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const ErrorMessage: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ErrorMessageProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ErrorState = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ErrorStatus = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ErrorWithId = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type EvaluationParams = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const Event: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const EventsProvider: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type EventsStore = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ExpandFieldSetOperation = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ExpandOperation = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ExpandPathOperation = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type FIXME = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const FallbackDiff: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const FeedbackContext: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type FeedbackContextValue = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const FeedbackDialog: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type FeedbackDialogProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const FieldActionMenu: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type FieldActionMenuProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type FieldActionsProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const FieldActionsProvider: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const FieldActionsResolver: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const FieldChange: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type FieldChangeNode = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type FieldCommentsProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type FieldOperationsAPI = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const FieldPresence: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type FieldPresenceData = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const FieldPresenceInner: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type FieldPresenceInnerProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type FieldPresenceProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const FieldPresenceWithOverlay: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type FieldPreviewComponent = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type FieldStatusProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type FieldValueError = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const FileInput: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const Filters: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const FormBuilder: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type FormBuilderComponentResolverContext = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type FormBuilderFilterFieldFn = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const FormCallbacksProvider: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type FormCallbacksValue = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const FormCell: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const FormContainer: never
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
export declare const FormFieldSet: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type FormFieldSetProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const FormFieldStatus: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type FormFieldValidation = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type FormFieldValidationError = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type FormFieldValidationInfo = never
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
export type FormFieldValidationWarning = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const FormInput: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type FormInputAbsolutePathArg = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type FormInputRelativePathArg = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const FormProvider: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const FormRow: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type FormState = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type FormValueContextValue = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const FormValueProvider: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const FromTo: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const FromToArrow: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type FromToArrowDirection = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type FromToIndex = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type FromToProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type GenerateStudioManifestOptions = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const GetFormValueProvider: never
/**
 * @deprecated Removed in v7. This was internal document-action plumbing with no public replacement.
 */
export declare const GetHookCollectionState: never
/**
 * @deprecated Removed in v7. This was internal document-action plumbing with no public replacement.
 */
export type GetHookCollectionStateProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type GlobalCopyPasteElementHandler = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type GlobalPresence = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type Grant = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type GrantsStoreOptions = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const GroupChange: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type GroupChangeNode = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type HandleCallbackResult = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type HexColor = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type HiddenField = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type HistoryStoreOptions = never
/**
 * @deprecated Removed in v7. `DocumentBadgeComponent` from `sanity` keeps the same call signature without extending this type.
 */
export type HookCollectionActionHook = never
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
export declare const HoveredFieldProvider: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type I18nNode = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type Id = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type IdPair = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const ImageInput: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const ImperativeToast: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type InitialSnapshotEvent = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type InitialValueState = never
/**
 * @deprecated Moved to `sanity/i18n`. Import `{InlineCode}` from `sanity/i18n` instead of `sanity`.
 */
export declare const InlineCode: never
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
export type InterpolationProp = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type IsEqualFunction = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const IsLastPaneProvider: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ItemDiff = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type KeyValueStore = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type KeyValueStoreValue = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const LATEST: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const LISTENER_PAUSE_GRACE_PERIOD: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type LatencyReportEvent = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type LegacyCallbackResult = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const LegacyLayerProvider: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type LegacyThemeTints = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const LinearProgress: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ListenQueryParams = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ListenerEvent = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ListenerGate = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const LiveManifestRegisterProvider: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type LoadableState = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type LoadedState = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const LoadingBlock: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type LoadingState = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type LoadingTuple = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const LocaleProvider: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const LocaleProviderBase: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type Location = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const MEDIA_LIBRARY_ASSET_ASPECT_TYPE_NAME: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ManifestWorkspaceInput = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type MatchWorkspaceOptions = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type MatchWorkspaceResult = never
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
export declare const MemberField: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const MemberFieldError: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type MemberFieldProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const MemberFieldSet: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const MemberItemError: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const MetaInfo: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type MetaInfoProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type MockAuthStoreOptions = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type MutationEvent = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type MutationPatch = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type MutationPerformanceEvent = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type NavbarAction = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type NavbarContextValue = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const NoChanges: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type NullDiff = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type NumberDiff = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const NumberInput: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type OAuthCallbackResult = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ObjectDiff = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const ObjectInput: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const ObjectInputMember: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ObjectInputMemberProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const ObjectInputMembers: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const ObjectMembers: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ObjectMembersProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ObserveDocumentTypeFromIdFn = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type Operation = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type OperationArgs = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type OperationImpl = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type OperationsAPI = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const PUBLISHED: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ParseError = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const ParseErrorsProvider: never
/**
 * @deprecated Removed in v7 with the legacy document history timeline. Document history always uses the events API: `useEventsStore` and `EventsStore` from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver` (`@internal`, can change or disappear in any release).
 */
export type ParsedTimeRef = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type PartialExcept = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type PartialIndexFieldPaths = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type PartialIndexSettings = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const PatchEvent: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type PauseWhileDocumentHiddenOptions = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type PendingMutationsEvent = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type PerspectiveNotWriteableReason = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const PerspectiveProvider: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const PopoverDialog: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const PortableTextInput: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type PortableTextMemberItem = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const PortalBoundaryProvider: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type Position = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type PreparedConfig = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type PresenceLocation = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const PresenceOverlay: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type PresenceOverlayProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const PresenceScope: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type PresenceScopeProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type PresentUser = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const Preview: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const PreviewCard: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type PreviewCardContextValue = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const PreviewLoader: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type PrimitiveFieldProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const RELEASES_INTENT: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const RELEASES_STUDIO_CLIENT_OPTIONS: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const RELEASE_DOCUMENT_TYPE: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const RESOLVE_INITIAL_VALUE_TIMEOUT_MS: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ReactHook = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ReconnectListenerOptions = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type Rect = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const ReferenceAutocomplete: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ReferenceDiff = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const ReferenceInput: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ReferenceInputOptions = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const ReferenceInputOptionsProvider: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const ReferenceInputPreviewCard: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type RegionWithIntersectionDetails = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const RelativeTime: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type RelativeTimeOptions = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type RelativeTimeProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const ReleaseAvatar: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const ReleaseAvatarIcon: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const ReleaseTitle: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const ReleasesNav: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ReleasesNavMenuItemPropsGetter = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type Reported = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ReportedRegionWithRect = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ReporterHook = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type RequestErrorChannel = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type RequestErrorClaim = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type RequestErrorClassification = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const RequestErrorDialog: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type RequestFailureDiagnostics = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const Resizable: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ResourceCache = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const ResourceCacheProvider: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ResourceCacheProviderProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type RetryingStatus = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const RevertChangesButton: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const RevertChangesConfirmDialog: never
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
export declare const SANITY_PATCH_TYPE: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const SanityDefaultPreview: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type SanityDefaultPreviewProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const ScheduleAction: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const ScheduledBadge: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const SchedulesContext: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type SchemaErrorContext = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const ScrollContainer: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ScrollContainerProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ScrollContextValue = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ScrollEventHandler = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const SearchButton: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type SearchContextValue = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const SearchDialog: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type SearchFactoryOptions = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const SearchHeader: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type SearchMachineContext = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type SearchMachineEmitted = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type SearchMachineEvent = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type SearchMachineInput = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type SearchMachineState = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type SearchOptions = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type SearchPartialIndexSettings = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const SearchPopover: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type SearchPopoverProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const SearchProvider: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const SearchResultItemPreview: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type SearchSort = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type SearchTerms = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const SelectInput: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type Selection = never
/**
 * @deprecated Removed in v7 with the legacy document history timeline. Document history always uses the events API: `useEventsStore` and `EventsStore` from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver` (`@internal`, can change or disappear in any release).
 */
export type SelectionState = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type Sentiment = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type Serializeable = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type Session = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type SetActiveGroupOperation = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const SingleDocReleaseProvider: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type Size = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const SlugInput: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const SourceProvider: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type SourceProviderProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type Status = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const StatusButton: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type StatusButtonProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type StoreRequestErrorHandler = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type StringDiff = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type StringDiffSegment = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const StringInput: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type StringSegmentChanged = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type StringSegmentUnchanged = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type StructureNodeIdValidationResult = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver/1`. This export is `@internal` and can change or disappear in any release.
 */
export declare const Studio: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const StudioAnnouncementsCard: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const StudioAnnouncementsDialog: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type StudioDiagnostics = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver/1`. This export is `@internal` and can change or disappear in any release.
 */
export declare const StudioDiagnosticsBridge: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver/1`. This export is `@internal` and can change or disappear in any release.
 */
export type StudioDiagnosticsBridgeApi = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const StudioFeedbackDialog: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type StudioFeedbackDialogProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const StudioFeedbackProvider: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver/1`. This export is `@internal` and can change or disappear in any release.
 */
export declare const StudioLayout: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const StudioLayoutComponent: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const StudioLogo: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type StudioManifest = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const StudioNavbar: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver/1`. This export is `@internal` and can change or disappear in any release.
 */
export declare const StudioProvider: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const StudioToolMenu: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type StudioWorkspaceManifest = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type SyncState = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const TIMELINE_ITEM_I18N_KEY_MAPPING: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const TagsArrayInput: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type TargetDocumentState = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type TargetScopeIdOptions = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const TelephoneInput: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type TemplateOption = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type TemplatePermissionsOptions = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type TemplatePermissionsResult = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const TemplatePreview: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const TextInput: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver/1`. This export is `@internal` and can change or disappear in any release.
 */
export declare const TextWithTone: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver/1`. This export is `@internal` and can change or disappear in any release.
 */
export type TextWithToneProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type TimeAgoOpts = never
/**
 * @deprecated Removed in v7 with the legacy document history timeline. Document history always uses the events API: `useEventsStore` and `EventsStore` from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver` (`@internal`, can change or disappear in any release).
 */
export declare const Timeline: never
/**
 * @deprecated Removed in v7 with the legacy document history timeline. Document history always uses the events API: `useEventsStore` and `EventsStore` from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver` (`@internal`, can change or disappear in any release).
 */
export declare const TimelineController: never
/**
 * @deprecated Removed in v7 with the legacy document history timeline. Document history always uses the events API: `useEventsStore` and `EventsStore` from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver` (`@internal`, can change or disappear in any release).
 */
export type TimelineControllerOptions = never
/**
 * @deprecated Removed in v7 with the legacy document history timeline. Document history always uses the events API: `useEventsStore` and `EventsStore` from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver` (`@internal`, can change or disappear in any release).
 */
export type TimelineOptions = never
/**
 * @deprecated Removed in v7 with the legacy document history timeline. Document history always uses the events API: `useEventsStore` and `EventsStore` from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver` (`@internal`, can change or disappear in any release).
 */
export type TimelineState = never
/**
 * @deprecated Removed in v7 with the legacy document history timeline. Document history always uses the events API: `useEventsStore` and `EventsStore` from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver` (`@internal`, can change or disappear in any release).
 */
export type TimelineStore = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ToastParams = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const ToolLink: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const TooltipOfDisabled: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type TrackedArea = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type TrackedChange = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type TrackerContextGetSnapshot = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type TrackerContextStore = never
/**
 * @deprecated Removed in v7 with the legacy document history timeline. Document history always uses the events API: `useEventsStore` and `EventsStore` from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver` (`@internal`, can change or disappear in any release).
 */
export type Transaction = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const TransformPatches: never
/**
 * @deprecated Moved to `sanity/i18n`. Import `{Translate}` from `sanity/i18n` instead of `sanity`.
 */
export declare const Translate: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type TypeChangeDiff = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const UniversalArrayInput: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const UpdateReadOnlyPlugin: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type UploaderDef = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const UpsellDescriptionSerializer: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const UpsellDialogDismissed: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const UpsellDialogLearnMoreCtaClicked: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const UpsellDialogUpgradeCtaClicked: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const UpsellDialogViewed: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type UpsellDialogViewedInfo = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const UrlInput: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type UseFeedbackReturn = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type UseFormStateOptions = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type UseInStudioFeedbackReturn = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type UseManageFavoriteProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type UseSearchMachineOptions = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const UserAvatar: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type UserAvatarProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type UserColor = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type UserColorHue = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type UserColorManager = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type UserColorManagerOptions = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const UserColorManagerProvider: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type UserColorManagerProviderProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type UserId = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type UserSessionPair = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type UserStoreOptions = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const VARIANTS_STUDIO_CLIENT_OPTIONS: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const VERSION_FOLDER: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ValidateWorkspaceOptions = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const ValueError: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type VariantConditionMap = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type VariantConditionValue = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type VariantConditions = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type VariantConditionsContext = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type VariantTypeConfig = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type VariantTypeContext = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type VariantTypesConfig = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const VersionChip: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type VersionInfoDocumentStub = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const VersionInlineBadge: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type VirtualizerScrollInstance = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const VirtualizerScrollInstanceProvider: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type VisibleWorkspacesContextValue = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const VisibleWorkspacesProvider: never
/**
 * @deprecated Removed in v7. Use `useReferringDocuments` from `sanity` instead (pass `[]` as the second argument to keep the old full-document shape).
 */
export declare const WithReferringDocuments: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type WorkspaceLike = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const WorkspaceLoader: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const WorkspaceProvider: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type WorkspaceProviderProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type WorkspaceSummary = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type WorkspacesContextValue = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const WorkspacesProvider: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type WorkspacesProviderProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ZIndexContextValue = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ZIndexContextValueKey = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const ZIndexProvider: never
/**
 * @deprecated Removed in v7. Pass the same options on the workspace `auth` config key directly instead of wrapping them in `createAuthStore()`.
 */
export declare const _createAuthStore: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const _isCustomDocumentTypeDefinition: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const _isSanityDocumentTypeDefinition: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const _isType: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const asLoadable: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const buildCommentRangeDecorations: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const buildLegacyTheme: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const buildRangeDecorationSelectionsFromComments: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const buildTextSelectionFromFragment: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const catchWithCount: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const checkoutPair: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const classifyConfigError: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const classifyRequestError: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const collate: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const compileFieldPath: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const connectionState: never
/**
 * @deprecated Removed in v7. Pass the same options on the workspace `auth` config key directly instead of wrapping them in `createAuthStore()`.
 */
export declare const createAuthStore: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const createBufferedDocument: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const createConnectionStatusStore: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const createDocumentPreviewStore: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const createDocumentStore: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const createDraftFrom: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const createGrantsStore: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const createHistoryStore: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const createHookFromObservableFactory: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const createKeyValueStore: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const createMockAuthStore: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const createObservableBufferedDocument: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const createPatchChannel: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const createPresenceStore: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const createProjectStore: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const createPublishedFrom: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const createRequestErrorChannel: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const createSWR: never
/**
 * @deprecated Moved to `sanity/media-library`. Import `{createSanityMediaLibraryFileSource}` from `sanity/media-library` instead of `sanity`.
 */
export declare const createSanityMediaLibraryFileSource: never
/**
 * @deprecated Moved to `sanity/media-library`. Import `{createSanityMediaLibraryImageSource}` from `sanity/media-library` instead of `sanity`.
 */
export declare const createSanityMediaLibraryImageSource: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const createSearch: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const createSourceFromConfig: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const createUserColorManager: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const createUserStore: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const createWorkspaceFromConfig: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const decodePath: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const defaultLocale: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const defaultRenderAnnotation: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const defaultRenderBlock: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const defaultRenderField: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const defaultRenderInlineBlock: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const defaultRenderInput: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const defaultRenderItem: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const defaultRenderPreview: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const defaultTemplateForType: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const defaultTemplatesForSchema: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const defaultTheme: never
/**
 * @deprecated Moved to `sanity/i18n`. Import `{defineLocale}` from `sanity/i18n` instead of `sanity`.
 */
export declare const defineLocale: never
/**
 * @deprecated Moved to `sanity/i18n`. Import `{defineLocaleResourceBundle}` from `sanity/i18n` instead of `sanity`.
 */
export declare const defineLocaleResourceBundle: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const defineLocalesResources: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const defineSearchMachine: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const deriveDocumentSyncState: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const documentFieldActionsReducer: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const documentIdEquals: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const editState: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const emitOperation: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const emptyValuesByType: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const encodePath: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const encodeVariantLinkParam: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const escapeField: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const evaluateWorkspaceHidden: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const fieldNeedsEscape: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const filterVariantsForSearch: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const findIndex: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const flattenConfig: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const formatRelativeLocale: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const formatRelativeLocalePublishDate: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const fromMutationPatches: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const getAnnotationAtPath: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const getAnnotationColor: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const getApiErrorCode: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const getCalendarLabels: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const getConfigContextFromSource: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const getCreatableVariantTarget: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const getDefaultVariant: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type getDiffAtPath = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const getDocumentIdForCanvasLink: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const getDocumentIsInPerspective: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const getDocumentPairPermissions: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const getDocumentValuePermissions: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const getDocumentVariantType: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const getDocumentVersionType: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const getDocumentVersionVariantId: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const getDraftId: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const getErrorMessage: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const getExpandOperations: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const getIdPair: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const getInitialValueStream: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const getItemKey: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const getItemKeySegment: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const getNamelessWorkspaceIdentifier: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const getPairListener: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const getPairTarget: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const getPreviewPaths: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const getPreviewStateObservable: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const getPreviewValueWithFallback: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const getProjectGrants: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const getProviderTitle: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const getPublishedId: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const getReferencePaths: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const getReleaseDocumentIdFromReleaseId: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const getReleaseIdFromReleaseDocumentId: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const getReleaseTone: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const getSchemaTypeTitle: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const getSearchableTypes: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const getSelectedVariant: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const getTargetDocument: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const getTargetScopeId: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const getTargetSiblings: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const getTemplatePermissions: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const getValueAtPath: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const getValueError: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const getVariantPublishedSibling: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const getVariantTitle: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const getVariantType: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const getVersionFromId: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const getVersionId: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const getVersionInlineBadge: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const getWorkspaceIdentifier: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const globalScope: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const grantsPermissionOn: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const hasCommentMessageValue: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const idMatchesPerspective: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const initialDocumentFieldActions: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isAddedItemDiff: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isAgentBundleName: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isArray: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isAuthStore: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isBuilder: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isCardinalityOnePerspective: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isCardinalityOneRelease: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isClientRequestError: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isCookielessCompatibleLoginMethod: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isCreateDocumentVersionEvent: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isCreateIfNotExistsMutation: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isCreateLiveDocumentEvent: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isCreateMutation: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isCreateOrReplaceMutation: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isCreateSquashedMutation: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isDefaultVariant: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isDeleteDocumentGroupEvent: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isDeleteDocumentVersionEvent: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isDeleteMutation: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isDev: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isDocumentInSelectedVariant: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isDocumentLimitError: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isDraft: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isDraftId: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isDraftPerspective: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isDraftVersion: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isEditDocumentVersionEvent: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isEmptyObject: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isFieldChange: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isGoingToUnpublish: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isGroupChange: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isIndexSegment: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isIndexTuple: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isInvalidSessionError: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isKeySegment: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. For an import that follows semver, use `{isKeyedObject}` from `@sanity/types`.
 */
export declare const isKeyedObject: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isNetworkError: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isNewDocument: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isNonNullable: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isNonSelectableTerminalEvent: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isPatchMutation: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isPausedCardinalityOneRelease: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isPerspectiveRaw: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isPerspectiveWriteable: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isProd: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isPublishDocumentVersionEvent: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isPublishedId: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isPublishedPerspective: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isPublishedVersion: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isRecord: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isReleaseDocument: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isReleasePerspective: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isReleaseScheduledOrScheduling: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isReleaseVersion: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isRemovedItemDiff: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isScheduleDocumentVersionEvent: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isSearchStrategy: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isString: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isSystemBundle: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isSystemBundleName: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isTextSelectionComment: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isTimeoutError: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isTitledListValue: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isTruthy: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isUnauthorizedError: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isUnchangedDiff: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isUnpublishDocumentEvent: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isUnscheduleDocumentVersionEvent: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isUpdateLiveDocumentEvent: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isValidAnnouncementAudience: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isValidAnnouncementRole: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isValidationError: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isValidationErrorMarker: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isValidationInfo: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isValidationInfoMarker: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isValidationWarning: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isValidationWarningMarker: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isVariantId: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isVariantVersion: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const isVersionId: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const joinPath: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const listenQuery: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const listenerGate: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const matchWorkspace: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const measureFirstEmission: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const measureFirstMatch: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const mergeParseErrors: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const newDraftFrom: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const noop: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const normalizeIndexSegment: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const normalizeIndexTupleSegment: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const normalizeKeySegment: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const normalizePathSegment: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const onRetry: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const operationEvents: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const operatorDefinitions: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const parseRetryAfter: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const parseStudioDiagnostics: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const passthroughErrorHandler: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const pathToString: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const pathsAreEqual: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const pauseWhileDocumentHidden: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const prefixPath: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const prepareConfig: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const prepareForPreview: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const prepareTemplates: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const readVersionType: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const reconnectListener: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const remoteSnapshots: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const removeDupes: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const removeMissingReferences: never
/**
 * @deprecated Moved to `sanity/i18n`. Import `{removeUndefinedLocaleResources}` from `sanity/i18n` instead of `sanity`.
 */
export declare const removeUndefinedLocaleResources: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const resolveConditionalProperty: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const resolveDiffComponent: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const resolveInitialObjectValue: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const resolveInitialValue: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const resolveInitialValueForType: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const resolveSchemaTypes: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const retryTransientFetch: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. For an import that follows semver, use `{searchStrategies}` from `@sanity/types`.
 */
export declare const searchStrategies: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const selectUpstreamVersion: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const serializeError: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const setAtPath: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const sliceString: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const snapshotPair: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const sortReleases: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const stringToPath: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const supportsTouch: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const systemBundles: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const toMutationPatches: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const truncateString: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const typed: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const uncaughtErrorHandler: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const unstable_useObserveDocument: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const unstable_useValuePreview: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const usEnglishLocale: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useActiveReleases: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useActiveWorkspace: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useAddonDataset: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useAgentVersionDisplay: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useAllReleases: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useAllVariants: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useAnnotationColor: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useArchivedReleases: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useCanvasCompanionDoc: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useCanvasNavigate: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useChangeIndicatorsReportedValues: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useChangeIndicatorsReporter: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useColorScheme: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useColorSchemeInternalValue: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useColorSchemeOptions: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useColorSchemeSetValue: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useColorSchemeValue: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useComlinkStore: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useComments: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useCommentsEnabled: never
/**
 * @deprecated Removed in v7. Comments API is the default; use `useCommentsEnabled` from `sanity`. For the add-on dataset escape hatch, set `comments: {legacy: true}` and use the `Legacy` exports from `sanity`.
 */
export declare const useCommentsEnabledV2: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useCommentsMode: never
/**
 * @deprecated Removed in v7. Comments API is the default; use `useCommentsMode` from `sanity`. For the add-on dataset escape hatch, set `comments: {legacy: true}` and use the `Legacy` exports from `sanity`.
 */
export declare const useCommentsModeV2: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useCommentsSelectedPath: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useCommentsTelemetry: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useConditionalToast: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useConfigContextFromSource: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useConnectionState: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useConnectionStatusStore: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useCopyErrorDetails: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useCopyPaste: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useCreatableVariantInitialValue: never
/**
 * @deprecated Moved to `sanity/i18n`. Import `{useCurrentLocale}` from `sanity/i18n` instead of `sanity`.
 */
export declare const useCurrentLocale: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useDialogStack: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useDidUpdate: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useDiffAnnotationColor: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useDivergenceNavigator: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useDocumentChange: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useDocumentDivergences: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useDocumentForm: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useDocumentIdStack: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useDocumentLimitsUpsellContext: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useDocumentOperation: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useDocumentOperationEvent: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useDocumentPairPermissions: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useDocumentPairPermissionsFromHookFactory: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useDocumentPresence: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useDocumentPreviewStore: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useDocumentPreviewValues: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useDocumentStore: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useDocumentSyncState: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useDocumentType: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useDocumentValuePermissions: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useDocumentValues: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useDocumentVersionInfo: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useDocumentVersionTitle: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useDocumentVersionTypeSortedList: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useDocumentVersions: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useEditState: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useEnhancedObjectDialog: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useEvents: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useEventsStore: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useExcludedPerspective: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useFeatureEnabled: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useFeedback: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useFieldActions: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useFilteredReleases: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useFormBuilder: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useFormCallbacks: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useFormState: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useFormatRelativeLocalePublishDate: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useGetDefaultPerspective: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useGetI18nText: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useGlobalCopyPasteElementHandler: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useGlobalPresence: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useGrantsStore: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useHistoryStore: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useHoveredField: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useI18nText: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useInStudioFeedback: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useInitialValue: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useInitialValueResolverContext: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useIsReleaseActive: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useKeyValueStore: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useLoadable: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useLocale: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useManageFavorite: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useMiddlewareComponents: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useNavigateToCanvasDoc: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useOnScroll: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useOnlyHasVersions: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useParseErrorForPath: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useParseErrors: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const usePauseToEditScheduledDraft: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const usePausedScheduledDraft: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const usePortalBoundary: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const usePresenceStore: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const usePreviewCard: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useProject: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useProjectDatasets: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useProjectStore: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useReconnectingToast: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useReferenceInputOptions: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useRelativeTime: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useReleasesIds: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useReleasesToolAvailable: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useRenderingContextStore: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useReportParseError: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useResolveInitialValueForType: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useResourceCache: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useRetryCountdown: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useReviewChanges: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useRovingFocus: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useScheduledDraftDocument: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useScheduledDraftsEnabled: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver/1`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useSchema: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useSearchMachine: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useSearchMaxFieldDepth: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useSearchState: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useSetImmediateValidation: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useSetPerspective: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useSetVariant: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useShallowUnique: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useSingleDocRelease: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useSource: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useStudioErrorHandler: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useStudioFeedbackTags: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useStudioUrl: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useSyncState: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useTargetDocumentState: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useTargetScopeId: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useTelemetryConsent: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useTemplatePermissions: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useTemplatePermissionsFromHookFactory: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useTemplates: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useThrottledCallback: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useTimeAgo: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useTimeZone: never
/**
 * @deprecated Removed in v7 with the legacy document history timeline. Document history always uses the events API: `useEventsStore` and `EventsStore` from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver` (`@internal`, can change or disappear in any release).
 */
export declare const useTimelineSelector: never
/**
 * @deprecated Removed in v7 with the legacy document history timeline. Document history always uses the events API: `useEventsStore` and `EventsStore` from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver` (`@internal`, can change or disappear in any release).
 */
export declare const useTimelineStore: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useTools: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useTrackerStore: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useTrackerStoreReporter: never
/**
 * @deprecated Moved to `sanity/i18n`. Import `{useTranslation}` from `sanity/i18n` instead of `sanity`.
 */
export declare const useTranslation: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useUnique: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useUnstableObserveDocument: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useUser: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useUserColor: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useUserColorManager: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useUserListWithPermissions: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useUserStore: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useValidationStatus: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useValuePreview: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useVariantDocumentOperations: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useVersionOperations: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useVersionRelease: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useVirtualizerScrollInstance: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useVisibleWorkspaces: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useWorkspaceLoader: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useWorkspaceSchemaId: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useWorkspaces: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useZIndex: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const userHasRole: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const validateBasePaths: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const validateNames: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const validateStructureNodeId: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const validateWorkspaces: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const validation: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const visitDiff: never
// </tombstones>
