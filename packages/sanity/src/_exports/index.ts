import {CorsOriginError} from '@sanity/client'
import {
  defineArrayMember,
  defineField,
  defineType,
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
  searchStrategies,
  typed,
} from '@sanity/types'
import {isEmptyObject} from '@sanity/util/content'
import {findIndex, noop} from 'rxjs'

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
import {
  useComments,
  useCommentsEnabled,
  useCommentsSelectedPath,
  useCommentsTelemetry,
} from '../core/comments/hooks'
import {buildCommentRangeDecorations} from '../core/comments/utils/inline-comments/buildCommentRangeDecorations'
import {buildRangeDecorationSelectionsFromComments} from '../core/comments/utils/inline-comments/buildRangeDecorationSelectionsFromComments'
import {buildTextSelectionFromFragment} from '../core/comments/utils/inline-comments/buildTextSelectionFromFragment'
import {BasicDocument} from '../core/components/BasicDocument'
import {BetaBadge} from '../core/components/BetaBadge'
import {AutoCollapseMenu, CollapseMenu} from '../core/components/collapseMenu/CollapseMenu'
import {CollapseMenuButton} from '../core/components/collapseMenu/CollapseMenuButton'
import {CommandList} from '../core/components/commandList/CommandList'
import {ContextMenuButton} from '../core/components/contextMenuButton/ContextMenuButton'
import {DefaultDocument} from '../core/components/DefaultDocument'
import {DocumentStatus} from '../core/components/documentStatus'
import {DocumentStatusIndicator} from '../core/components/documentStatusIndicator'
import {ErrorActions, serializeError, useCopyErrorDetails} from '../core/components/errorActions'
import {GlobalErrorHandler} from '../core/components/globalErrorHandler'
import {GetHookCollectionState} from '../core/components/hookCollection'
import {Hotkeys} from '../core/components/Hotkeys'
import {DateTimeInput} from '../core/components/inputs/DateInputs/DateTimeInput'
import {InsufficientPermissionsMessage} from '../core/components/InsufficientPermissionsMessage'
import {IntentButton} from '../core/components/IntentButton'
import {LoadingBlock} from '../core/components/loadingBlock'
import {PopoverDialog} from '../core/components/popoverDialog'
import {
  PreviewCard,
  ReferenceInputPreviewCard,
  usePreviewCard,
} from '../core/components/previewCard'
import {
  DetailPreview,
  InlinePreview,
  MediaPreview,
  TemplatePreview,
} from '../core/components/previews'
import {CompactPreview} from '../core/components/previews/general/CompactPreview'
import {DefaultPreview} from '../core/components/previews/general/DefaultPreview'
import {BlockImagePreview} from '../core/components/previews/portableText/BlockImagePreview'
import {BlockPreview} from '../core/components/previews/portableText/BlockPreview'
import {LinearProgress} from '../core/components/progress'
import {CircularProgress} from '../core/components/progress/CircularProgress'
import {
  useTrackerStore,
  useTrackerStoreReporter,
} from '../core/components/react-track-elements/hooks'
import {RelativeTime} from '../core/components/RelativeTime'
import {useRovingFocus} from '../core/components/rovingFocus/useRovingFocus'
import {ScrollContainer, useOnScroll} from '../core/components/scroll'
import {StatusButton} from '../core/components/StatusButton'
import {TextWithTone} from '../core/components/textWithTone'
import {TooltipOfDisabled} from '../core/components/TooltipOfDisabled'
import {ImperativeToast, LegacyLayerProvider} from '../core/components/transitional'
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
  defineDocumentFieldAction,
  documentFieldActionsReducer,
  initialDocumentFieldActions,
} from '../core/config/document/fieldActions'
import {defineDocumentInspector} from '../core/config/document/inspector'
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
  getConfigContextFromSource,
  useConfigContextFromSource,
} from '../core/config/useConfigContextFromSource'
import {
  getSanityCreateLinkMetadata,
  isSanityCreateExcludedType,
  isSanityCreateLinked,
  isSanityCreateLinkedDocument,
  isSanityCreateStartCompatibleDoc,
  useSanityCreateConfig,
} from '../core/create'
import {isDev, isProd} from '../core/environment'
import {
  DiffCard,
  DiffErrorBoundary,
  DiffFromTo,
  DiffInspectWrapper,
  diffResolver,
  DiffString,
  DiffStringSegment,
  DiffTooltip,
  FallbackDiff,
  FieldChange,
  FromTo,
  FromToArrow,
  GroupChange,
  isAddedItemDiff,
  isFieldChange,
  isGroupChange,
  isRemovedItemDiff,
  isUnchangedDiff,
  MetaInfo,
  NoChanges,
  resolveDiffComponent,
  RevertChangesButton,
  TIMELINE_ITEM_I18N_KEY_MAPPING,
  TimelineEvent,
  useAnnotationColor,
  useDiffAnnotationColor,
  useDocumentChange,
} from '../core/field/diff'
import {
  getAnnotationAtPath,
  getAnnotationColor,
  getDiffAtPath,
  visitDiff,
} from '../core/field/diff/annotations/helpers'
import {ChangeBreadcrumb} from '../core/field/diff/components/ChangeBreadcrumb'
import {ChangeList} from '../core/field/diff/components/ChangeList'
import {ChangeResolver} from '../core/field/diff/components/ChangeResolver'
import {ChangesError} from '../core/field/diff/components/ChangesError'
import {ChangeTitleSegment} from '../core/field/diff/components/ChangeTitleSegment'
import {ValueError} from '../core/field/diff/components/ValueError'
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
} from '../core/field/paths'
import {getValueError} from '../core/field/validation'
import {EditPortal} from '../core/form/components/EditPortal'
import {FormField} from '../core/form/components/formField/FormField'
import {FormFieldHeaderText} from '../core/form/components/formField/FormFieldHeaderText'
import {FormFieldSet} from '../core/form/components/formField/FormFieldSet'
import {FormFieldStatus} from '../core/form/components/formField/FormFieldStatus'
import {FormFieldValidationStatus} from '../core/form/components/formField/FormFieldValidationStatus'
import {FormInput} from '../core/form/components/FormInput'
import {FormValueProvider, useFormValue} from '../core/form/contexts/FormValue'
import {GetFormValueProvider, useGetFormValue} from '../core/form/contexts/GetFormValue'
import {
  FieldActionMenu,
  FieldActionsProvider,
  FieldActionsResolver,
  useFieldActions,
} from '../core/form/field/actions'
import {HoveredFieldProvider} from '../core/form/field/HoveredFieldProvider'
import {useHoveredField} from '../core/form/field/useHoveredField'
import {useDidUpdate} from '../core/form/hooks/useDidUpdate'
import {
  BlockEditor,
  BooleanInput,
  DateInput,
  EmailInput,
  getCalendarLabels,
  NumberInput,
  ObjectInput,
  PortableTextInput,
  SelectInput,
  SlugInput,
  StringInput,
  TagsArrayInput,
  TelephoneInput,
  TextInput,
  UniversalArrayInput,
  UrlInput,
  useVirtualizerScrollInstance,
  VirtualizerScrollInstanceProvider,
} from '../core/form/inputs'
import {ArrayOfObjectsFunctions} from '../core/form/inputs/arrays/ArrayOfObjectsInput/ArrayOfObjectsFunctions'
import {ArrayOfObjectsInput} from '../core/form/inputs/arrays/ArrayOfObjectsInput/ArrayOfObjectsInput'
import {ArrayOfObjectOptionsInput} from '../core/form/inputs/arrays/ArrayOfOptionsInput/ArrayOfObjectOptionsInput'
import {ArrayOfOptionsInput} from '../core/form/inputs/arrays/ArrayOfOptionsInput/ArrayOfOptionsInput'
import {ArrayOfPrimitiveOptionsInput} from '../core/form/inputs/arrays/ArrayOfOptionsInput/ArrayOfPrimitiveOptionsInput'
import {ArrayOfPrimitivesFunctions} from '../core/form/inputs/arrays/ArrayOfPrimitivesInput/ArrayOfPrimitivesFunctions'
import {ArrayOfPrimitivesInput} from '../core/form/inputs/arrays/ArrayOfPrimitivesInput/ArrayOfPrimitivesInput'
import {CrossDatasetReferenceInput} from '../core/form/inputs/CrossDatasetReferenceInput/CrossDatasetReferenceInput'
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
import {PatchEvent} from '../core/form/patch'
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
import {createPatchChannel} from '../core/form/patch/PatchChannel'
import {resolveConditionalProperty} from '../core/form/store/conditional-property'
import {setAtPath} from '../core/form/store/stateTreeHelper'
import {useFormState} from '../core/form/store/useFormState'
import {getExpandOperations} from '../core/form/store/utils/getExpandOperations'
import {
  FormCallbacksProvider,
  ReferenceInputOptionsProvider,
  useFormCallbacks,
  useReferenceInputOptions,
} from '../core/form/studio/contexts'
import {useReviewChanges} from '../core/form/studio/contexts/reviewChanges/useReviewChanges'
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
} from '../core/form/types'
import {useDocumentForm} from '../core/form/useDocumentForm'
import {useFormBuilder} from '../core/form/useFormBuilder'
import {fromMutationPatches, toMutationPatches} from '../core/form/utils/mutationPatch'
import {decodePath, encodePath} from '../core/form/utils/path'
import {TransformPatches} from '../core/form/utils/TransformPatches'
import {useClient} from '../core/hooks/useClient'
import {useConnectionState} from '../core/hooks/useConnectionState'
import {useDataset} from '../core/hooks/useDataset'
import {useDateTimeFormat} from '../core/hooks/useDateTimeFormat'
import {useDocumentOperation} from '../core/hooks/useDocumentOperation'
import {useDocumentOperationEvent} from '../core/hooks/useDocumentOperationEvent'
import {useEditState} from '../core/hooks/useEditState'
import {useFeatureEnabled} from '../core/hooks/useFeatureEnabled'
import {useFormattedDuration} from '../core/hooks/useFormattedDuration'
import {useGlobalCopyPasteElementHandler} from '../core/hooks/useGlobalCopyPasteElementHandler'
import {useListFormat} from '../core/hooks/useListFormat'
import {useNumberFormat} from '../core/hooks/useNumberFormat'
import {useProjectId} from '../core/hooks/useProjectId'
import {useReferringDocuments} from '../core/hooks/useReferringDocuments'
import {useRelativeTime} from '../core/hooks/useRelativeTime'
import {useSchema} from '../core/hooks/useSchema'
import {useSyncState} from '../core/hooks/useSyncState'
import {useTemplates} from '../core/hooks/useTemplates'
import {useTimeAgo} from '../core/hooks/useTimeAgo'
import {useTools} from '../core/hooks/useTools'
import {useUnitFormatter} from '../core/hooks/useUnitFormatter'
import {useUserListWithPermissions} from '../core/hooks/useUserListWithPermissions'
import {useValidationStatus} from '../core/hooks/useValidationStatus'
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
import {PerspectiveProvider} from '../core/perspective/PerspectiveProvider'
import {useExcludedPerspective} from '../core/perspective/useExcludedPerspective'
import {usePerspective} from '../core/perspective/usePerspective'
import {useSetPerspective} from '../core/perspective/useSetPerspective'
import {DocumentPreviewPresence, PresenceOverlay, PresenceScope} from '../core/presence'
import {
  FieldPresence,
  FieldPresenceInner,
  FieldPresenceWithOverlay,
} from '../core/presence/FieldPresence'
import {
  getPreviewPaths,
  getPreviewStateObservable,
  getPreviewValueWithFallback,
  prepareForPreview,
  Preview,
  PreviewLoader,
  SanityDefaultPreview,
  unstable_useObserveDocument,
  unstable_useValuePreview,
} from '../core/preview'
import {createDocumentPreviewStore} from '../core/preview/documentPreviewStore'
import {VersionChip} from '../core/releases/components/documentHeader/VersionChip'
import {ReleaseAvatar} from '../core/releases/components/ReleaseAvatar'
import {
  getVersionInlineBadge,
  VersionInlineBadge,
} from '../core/releases/components/VersionInlineBadge'
import {
  useDocumentVersions,
  useDocumentVersionTypeSortedList,
  useOnlyHasVersions,
} from '../core/releases/hooks'
import {useIsReleaseActive} from '../core/releases/hooks/useIsReleaseActive'
import {useVersionOperations} from '../core/releases/hooks/useVersionOperations'
import {RELEASES_INTENT} from '../core/releases/plugin'
import {isReleaseDocument} from '../core/releases/store/types'
import {useActiveReleases} from '../core/releases/store/useActiveReleases'
import {useArchivedReleases} from '../core/releases/store/useArchivedReleases'
import {useDocumentVersionInfo} from '../core/releases/store/useDocumentVersionInfo'
import {useReleasesIds} from '../core/releases/store/useReleasesIds'
import {LATEST} from '../core/releases/util/const'
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
import {EditScheduleForm, ScheduleAction, ScheduledBadge} from '../core/scheduledPublishing'
import {getSchemaTypeTitle} from '../core/schema'
import {createSchema} from '../core/schema/createSchema'
import {getSearchableTypes, isPerspectiveRaw} from '../core/search'
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
import {
  editState,
  emitOperation,
  getInitialValueStream,
  getPairListener,
  listenQuery,
  operationEvents,
  remoteSnapshots,
  snapshotPair,
  useDocumentType,
  useDocumentValues,
  useInitialValue,
  useInitialValueResolverContext,
} from '../core/store/_legacy/document'
import {createBufferedDocument} from '../core/store/_legacy/document/buffered-doc/createBufferedDocument'
import {createObservableBufferedDocument} from '../core/store/_legacy/document/buffered-doc/createObservableBufferedDocument'
import {checkoutPair} from '../core/store/_legacy/document/document-pair/checkoutPair'
import {validation} from '../core/store/_legacy/document/document-pair/validation'
import {createDocumentStore} from '../core/store/_legacy/document/document-store'
import {useResolveInitialValueForType} from '../core/store/_legacy/document/useResolveInitialValueForType'
import {
  getDocumentPairPermissions,
  getDocumentValuePermissions,
  useDocumentPairPermissions,
  useDocumentPairPermissionsFromHookFactory,
  useDocumentValuePermissions,
} from '../core/store/_legacy/grants'
import {createGrantsStore, grantsPermissionOn} from '../core/store/_legacy/grants/grantsStore'
import {
  getTemplatePermissions,
  useTemplatePermissions,
  useTemplatePermissionsFromHookFactory,
} from '../core/store/_legacy/grants/templatePermissions'
import {Timeline, TimelineController} from '../core/store/_legacy/history'
import {
  createHistoryStore,
  removeMissingReferences,
} from '../core/store/_legacy/history/createHistoryStore'
import {useTimelineSelector} from '../core/store/_legacy/history/useTimelineSelector'
import {useTimelineStore} from '../core/store/_legacy/history/useTimelineStore'
import {createPresenceStore, SESSION_ID} from '../core/store/_legacy/presence/presence-store'
import {useDocumentPresence} from '../core/store/_legacy/presence/useDocumentPresence'
import {useGlobalPresence} from '../core/store/_legacy/presence/useGlobalPresence'
import {useProject, useProjectDatasets} from '../core/store/_legacy/project'
import {createProjectStore} from '../core/store/_legacy/project/projectStore'
import {ResourceCacheProvider, useResourceCache} from '../core/store/_legacy/ResourceCacheProvider'
import {createUserStore} from '../core/store/_legacy/user/userStore'
import {
  EventsProvider,
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
  useEvents,
  useEventsStore,
} from '../core/store/events'
import {createKeyValueStore} from '../core/store/key-value/keyValueStore'
import {useCurrentUser, useUser} from '../core/store/user/hooks'
import {
  ActiveWorkspaceMatcher,
  matchWorkspace,
  useActiveWorkspace,
} from '../core/studio/activeWorkspaceMatcher'
import {useAddonDataset} from '../core/studio/addonDataset'
import {AddonDatasetProvider} from '../core/studio/addonDataset/AddonDatasetProvider'
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
import {
  defineSearchFilter,
  defineSearchFilterOperators,
  defineSearchOperator,
  operatorDefinitions,
  SearchButton,
  SearchDialog,
  SearchHeader,
  SearchPopover,
  SearchResultItemPreview,
  StudioLogo,
  StudioNavbar,
  StudioToolMenu,
  ToolLink,
  useSearchMaxFieldDepth,
} from '../core/studio/components'
import {Filters} from '../core/studio/components/navbar/search/components/filters/Filters'
import {
  SearchProvider,
  useSearchState,
} from '../core/studio/components/navbar/search/contexts/search'
import {CopyPasteProvider, useCopyPaste} from '../core/studio/copyPaste/CopyPasteProvider'
import {renderStudio} from '../core/studio/renderStudio'
import {SourceProvider, useSource} from '../core/studio/source'
import {Studio} from '../core/studio/Studio'
import {
  isValidAnnouncementAudience,
  isValidAnnouncementRole,
  StudioAnnouncementsCard,
  StudioAnnouncementsDialog,
} from '../core/studio/studioAnnouncements'
import {StudioLayout, StudioLayoutComponent} from '../core/studio/StudioLayout'
import {StudioProvider} from '../core/studio/StudioProvider'
import {
  UpsellDescriptionSerializer,
  UpsellDialogDismissed,
  UpsellDialogLearnMoreCtaClicked,
  UpsellDialogUpgradeCtaClicked,
  UpsellDialogViewed,
} from '../core/studio/upsell'
import {useWorkspace, WorkspaceProvider} from '../core/studio/workspace'
import {ErrorMessage} from '../core/studio/workspaceLoader/ErrorMessage'
import {useWorkspaceLoader, WorkspaceLoader} from '../core/studio/workspaceLoader/WorkspaceLoader'
import {getNamelessWorkspaceIdentifier, getWorkspaceIdentifier} from '../core/studio/workspaces'
import {useWorkspaces} from '../core/studio/workspaces/useWorkspaces'
import {
  validateBasePaths,
  validateNames,
  validateWorkspaces,
} from '../core/studio/workspaces/validateWorkspaces'
import {WorkspacesProvider} from '../core/studio/workspaces/WorkspacesProvider'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../core/studioClient'
import {IsLastPaneProvider} from '../core/tasks/context/isLastPane'
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
import {buildLegacyTheme, defaultTheme} from '../core/theme'
import {UserColorManagerProvider} from '../core/user-color'
import {useUserColor, useUserColorManager} from '../core/user-color/hooks'
import {createUserColorManager} from '../core/user-color/manager'
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
import {Rule, validateDocument} from '../core/validation'
import {SANITY_VERSION} from '../core/version'
import {Resizable} from '../presentation/components/Resizable'

export {
  _createAuthStore,
  _isCustomDocumentTypeDefinition,
  _isSanityDocumentTypeDefinition,
  ActiveWorkspaceMatcher,
  AddonDatasetProvider,
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
  BasicDocument,
  BetaBadge,
  BlockEditor,
}
export {
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
  Rule as ConcreteRuleClass,
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
  decodePath,
  DEFAULT_MAX_RECURSION_DEPTH,
  DEFAULT_STUDIO_CLIENT_OPTIONS,
  DefaultDocument,
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
  GlobalErrorHandler,
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
  ScheduleAction,
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
