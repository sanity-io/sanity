/**
 * Private internals of `sanity` that do not follow semver.
 *
 * Everything exported from this entry is an implementation detail of Sanity Studio: it is
 * exported because the Studio's own tools and plugins (structure, presentation, vision, …) need
 * it, not because it is meant to be used by studios or third-party plugins. Every export can
 * change or disappear in any release, including patch releases, without notice, without a
 * deprecation period and without being mentioned in the changelog.
 *
 * If you import from this entry anyway: pin an exact `sanity` version, expect breakage on every
 * upgrade, and know that there is no support for it. First-party packages released from this
 * monorepo in lockstep with `sanity` (`@sanity/vision`) are the exception: they ship with a
 * matching `sanity` and are rebuilt whenever an internal changes.
 *
 * This entry is a superset of what the public entries hide: every `@internal` declaration a
 * public entry exports is also exported here, so this is always a working import path, and names
 * that have since become public API stay exported here too for the consumers that already
 * migrated. The `internal-exports` test in the `@repo/test-dts-exports` workspace enforces the
 * superset direction and keeps the compatibility list on the public entries explicit.
 *
 * Two subpaths split off what a studio does not need while it boots: `…-1` holds what code that
 * runs before sign-in may import, and `…-2` the internals only lazily loaded code uses (the
 * document stack). What stays here is what the studio shell and code all over a studio use, so
 * that importing this entry does not load forms, diffs or document panes.
 */

// From `sanity`
export {useCanvasNavigate} from '../core/canvas/useCanvasNavigate'
export {useNavigateToCanvasDoc} from '../core/canvas/useNavigateToCanvasDoc'
export {getDocumentIdForCanvasLink} from '../core/canvas/utils/getDocumentIdForCanvasLink'
export {BetaBadge, type BetaBadgeProps} from '../core/components/BetaBadge'
export {CapabilityGate} from '../core/components/CapabilityGate'
export {DashboardLink} from '../core/components/DashboardLink'
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
export {Delay} from '../core/components/Delay'
export {ErrorActions, type ErrorActionsProps} from '../core/components/errorActions/ErrorActions'
export {type ErrorWithId} from '../core/components/errorActions/types'
export {
  serializeError,
  useCopyErrorDetails,
} from '../core/components/errorActions/useCopyErrorDetails'
export {type InsufficientPermissionsMessageProps} from '../core/components/InsufficientPermissionsMessage'
export {LoadingBlock} from '../core/components/loadingBlock/LoadingBlock'
export {PopoverDialog} from '../core/components/popoverDialog/PopoverDialog'
export {PortalBoundaryProvider} from '../core/components/portalBoundary/PortalBoundaryProvider'
export {usePortalBoundary} from '../core/components/portalBoundary/usePortalBoundary'
export {
  type PreviewCardContextValue,
  ReferenceInputPreviewCard,
  usePreviewCard,
} from '../core/components/previewCard/PreviewCard'
export {RelativeTime, type RelativeTimeProps} from '../core/components/RelativeTime'
export {Resizable} from '../core/components/resizer/Resizable'
export {useOnScroll} from '../core/components/scroll/hooks'
export {ScrollContainer, type ScrollContainerProps} from '../core/components/scroll/scrollContainer'
export {type ScrollContextValue, type ScrollEventHandler} from '../core/components/scroll/types'
export {TooltipOfDisabled} from '../core/components/TooltipOfDisabled'
export {
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  ImperativeToast,
  type ToastParams,
} from '../core/components/transitional/ImperativeToast'
export {
  LegacyLayerProvider,
  type ZIndexContextValueKey,
} from '../core/components/transitional/LegacyLayerProvider'
export {type ZIndexContextValue} from '../core/components/zOffsets/types'
export {useZIndex} from '../core/components/zOffsets/useZIndex'
export {ZIndexProvider} from '../core/components/zOffsets/ZIndexProvider'
export {type CookielessCompatibleLoginMethod} from '../core/config/auth/types'
export {useMiddlewareComponents} from '../core/config/components/useMiddlewareComponents'
export {
  ConfigPropertyError,
  type ConfigPropertyErrorOptions,
} from '../core/config/ConfigPropertyError'
export {
  ConfigResolutionError,
  type ConfigResolutionErrorOptions,
} from '../core/config/ConfigResolutionError'
export {initialDocumentFieldActions} from '../core/config/document/fieldActions'
export {documentFieldActionsReducer} from '../core/config/document/fieldActions/reducer'
export {getDocumentVersionType} from '../core/config/document/useConfiguredDocumentActionIds'
export {flattenConfig} from '../core/config/flattenConfig'
export {prepareConfig} from '../core/config/prepareConfig'
export {
  createSourceFromConfig,
  createWorkspaceFromConfig,
  type CreateWorkspaceFromConfigOptions,
} from '../core/config/resolveConfig'
export {resolveSchemaTypes} from '../core/config/resolveSchemaTypes'
export {type SchemaErrorContext} from '../core/config/SchemaError'
export {type NavbarAction} from '../core/config/studio/types'
export {
  type AsyncConfigPropertyReducer,
  type BetaFeatures,
  type ConfigPropertyReducer,
  type DocumentLayoutProps,
  type FormBuilderComponentResolverContext,
  type PreparedConfig,
  type VariantConditionMap,
  type VariantConditions,
  type VariantConditionsContext,
  type VariantConditionValue,
  type VariantTypeConfig,
  type VariantTypeContext,
  type VariantTypesConfig,
  type WorkspaceSummary,
} from '../core/config/types'
export {
  getConfigContextFromSource,
  useConfigContextFromSource,
} from '../core/config/useConfigContextFromSource'
export {isProd} from '../core/environment'
export {isImportError} from '../core/error/isImportError'
export {FeedbackDialog, type FeedbackDialogProps} from '../core/feedback/components/FeedbackDialog'
export {
  StudioFeedbackDialog,
  type StudioFeedbackDialogProps,
} from '../core/feedback/components/StudioFeedbackDialog'
export {useFeedback, type UseFeedbackReturn} from '../core/feedback/hooks/useFeedback'
export {
  useInStudioFeedback,
  type UseInStudioFeedbackReturn,
} from '../core/feedback/hooks/useInStudioFeedback'
export {useStudioFeedbackTags} from '../core/feedback/hooks/useStudioFeedbackTags'
export {type Sentiment} from '../core/feedback/types'
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
export {type FIXME} from '../core/FIXME'
export {useConditionalToast} from '../core/hooks/useConditionalToast'
export {
  connectionState,
  type ConnectionState,
  useConnectionState,
} from '../core/hooks/useConnectionState'
export {type DocumentIdStack, useDocumentIdStack} from '../core/hooks/useDocumentIdStack'
export {useDocumentOperationEvent} from '../core/hooks/useDocumentOperationEvent'
export {
  deriveDocumentSyncState,
  type DocumentSyncState,
  useDocumentSyncState,
} from '../core/hooks/useDocumentSyncState'
export {useFeatureEnabled} from '../core/hooks/useFeatureEnabled'
export {useFilteredReleases} from '../core/hooks/useFilteredReleases'
export {useReconnectingToast} from '../core/hooks/useReconnectingToast'
export {type RelativeTimeOptions} from '../core/hooks/useRelativeTime'
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
export {useVersionRelease} from '../core/hooks/useVersionRelease'
export {LocaleProvider, LocaleProviderBase} from '../core/i18n/components/LocaleProvider'
export {
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  defineLocalesResources,
} from '../core/i18n/helpers'
export {useGetI18nText} from '../core/i18n/hooks/useGetI18nText'
export {type I18nNode, useI18nText} from '../core/i18n/hooks/useI18nText'
export {useLocale} from '../core/i18n/hooks/useLocale'
export {defaultLocale, usEnglishLocale} from '../core/i18n/locales'
export {useDocumentLimitsUpsellContext} from '../core/limits/context/documents/DocumentLimitUpsellProvider'
export {isDocumentLimitError} from '../core/limits/context/documents/isDocumentLimitError'
export {getDefaultVariant} from '../core/perspective/getDefaultVariant'
export {getSelectedVariant} from '../core/perspective/getSelectedVariant'
export {
  isPerspectiveWriteable,
  type PerspectiveNotWriteableReason,
} from '../core/perspective/isPerspectiveWriteable'
export {ReleasesNav} from '../core/perspective/navbar/releases/ReleasesNav'
export {PerspectiveProvider} from '../core/perspective/PerspectiveProvider'
export {type ReleasesNavMenuItemPropsGetter} from '../core/perspective/types'
export {useExcludedPerspective} from '../core/perspective/useExcludedPerspective'
export {useSetPerspective} from '../core/perspective/useSetPerspective'
export {useSetVariant} from '../core/perspective/useSetVariant'
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
// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
export {unstable_useObserveDocument} from '../core/preview/useObserveDocument'
export {
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  unstable_useValuePreview,
  useValuePreview,
} from '../core/preview/useValuePreview'
export {getPreviewPaths} from '../core/preview/utils/getPreviewPaths'
export {prepareForPreview} from '../core/preview/utils/prepareForPreview'
export {ReleaseTitle} from '../core/releases/components/ReleaseTitle'
export {useFormatRelativeLocalePublishDate} from '../core/releases/hooks/useFormatRelativeLocalePublishDate'
export {useIsReleaseActive} from '../core/releases/hooks/useIsReleaseActive'
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
  isDraftPerspective,
  isPublishedPerspective,
  isReleaseScheduledOrScheduling,
} from '../core/releases/util/util'
export {useReleasesToolAvailable} from '../core/schedules/hooks/useReleasesToolAvailable'
export {getSchemaTypeTitle} from '../core/schema/helpers'
export {compileFieldPath} from '../core/search/common/compileFieldPath'
export {getSearchableTypes} from '../core/search/common/getSearchableTypes'
export {
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  isPerspectiveRaw,
} from '../core/search/common/isPerspectiveRaw'
export {
  type PartialIndexFieldPaths,
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
export {usePauseToEditScheduledDraft} from '../core/singleDocRelease/hooks/usePauseToEditScheduledDraft'
export {useScheduledDraftDocument} from '../core/singleDocRelease/hooks/useScheduledDraftDocument'
export {useScheduledDraftsEnabled} from '../core/singleDocRelease/hooks/useScheduledDraftsEnabled'
export {isAgentBundleName} from '../core/store/agent/createAgentBundlesStore'
export {
  type AgentVersionDisplay,
  useAgentVersionDisplay,
} from '../core/store/agent/useAgentVersionDisplay'
export {type RequestFailureDiagnostics} from '../core/studio/requestErrors/diagnoseRequestFailure'
export {
  createMockAuthStore,
  type MockAuthStoreOptions,
} from '../core/store/auth/mock/createMockAuthStore'
export {
  type LegacyCallbackResult,
  type HandleCallbackResult,
  type OAuthCallbackResult,
} from '../core/store/auth/types'
export {isCookielessCompatibleLoginMethod} from '../core/store/auth/legacy/asserters'
export {isAuthStore} from '../core/store/auth/utils/asserters'
export {
  type ConnectedStatus,
  CONNECTING,
  type ConnectingStatus,
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
  // oxlint-disable-next-line no-deprecated -- the key-value store stays exported until the next major
  useKeyValueStore,
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
export {type DocumentVersionEventType, type EventsStore} from '../core/store/events/types'
export {useEventsStore} from '../core/store/events/useEventsStore'
export {
  type DocumentPairPermissionsOptions,
  type DocumentPermission,
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
// oxlint-disable-next-line no-deprecated -- the key-value store stays exported until the next major
export {createKeyValueStore} from '../core/store/key-value/keyValueStore'
// oxlint-disable-next-line no-deprecated -- the key-value store stays exported until the next major
export {type KeyValueStore, type KeyValueStoreValue} from '../core/store/key-value/types'
export {
  LISTENER_PAUSE_GRACE_PERIOD,
  type ListenerGate,
  listenerGate,
  pauseWhileDocumentHidden,
  type PauseWhileDocumentHiddenOptions,
} from '../core/store/listenerGate/listenerGate'
export {
  useStudioPreference,
  useStudioPreferenceList,
} from '../core/store/preferences/useStudioPreference'
export {createPresenceStore, getSessionId} from '../core/store/presence/presence-store'
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
export {
  type ResourceCache,
  ResourceCacheProvider,
  type ResourceCacheProviderProps,
  useResourceCache,
} from '../core/store/ResourceCacheProvider'
export {useUser} from '../core/store/user/hooks'
export {createUserStore, type UserStoreOptions} from '../core/store/user/userStore'
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
export {
  ColorSchemeCustomProvider,
  ColorSchemeLocalStorageProvider,
  ColorSchemeProvider,
  type ColorSchemeProviderProps,
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  useColorScheme,
  useColorSchemeInternalValue,
  useColorSchemeOptions,
} from '../core/studio/colorScheme'
export {
  DiagnosticsReport,
  type DiagnosticsReportProps,
} from '../core/studio/components/navbar/resources/DiagnosticsReport'
export {Filters} from '../core/studio/components/navbar/search/components/filters/Filters'
export {SearchHeader} from '../core/studio/components/navbar/search/components/SearchHeader'
export {
  SearchPopover,
  type SearchPopoverProps,
} from '../core/studio/components/navbar/search/components/SearchPopover'
export {SearchResultItemPreview} from '../core/studio/components/navbar/search/components/searchResults/item/SearchResultItemPreview'
export {type SearchContextValue} from '../core/studio/components/navbar/search/contexts/search/SearchContext'
export {SearchProvider} from '../core/studio/components/navbar/search/contexts/search/SearchProvider'
export {useSearchState} from '../core/studio/components/navbar/search/contexts/search/useSearchState'
export {operatorDefinitions} from '../core/studio/components/navbar/search/definitions/operators/defaultOperators'
export {
  type PartialIndexSettings,
  type SearchPartialIndexSettings,
  // oxlint-disable-next-line no-deprecated -- only the overload without field paths is deprecated
  useSearchMaxFieldDepth,
} from '../core/studio/components/navbar/search/hooks/useSearchMaxFieldDepth'
export {SearchButton} from '../core/studio/components/navbar/search/SearchButton'
export {SearchDialog} from '../core/studio/components/navbar/search/SearchDialog'
export {CONTENT_RELEASES_TIME_ZONE_SCOPE} from '../core/studio/constants'
export {type StudioDiagnostics} from '../core/studio/diagnostics/gatherStudioDiagnostics'
export {parseStudioDiagnostics} from '../core/studio/diagnostics/parseStudioDiagnostics'
export {StudioFeedbackProvider} from '../core/studio/feedback/StudioFeedbackProvider'
export {LiveManifestRegisterProvider} from '../core/studio/manifest/LiveManifestRegisterProvider'
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
export {
  RequestErrorDialog,
  useRetryCountdown,
} from '../core/studio/requestErrors/RequestErrorDialog'
export {type RequestErrorChannel, type RequestErrorClaim} from '../core/studio/requestErrors/types'
export {
  SourceProvider,
  type SourceProviderProps,
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  useSource,
} from '../core/studio/source'
export {StudioAnnouncementsCard} from '../core/studio/studioAnnouncements/StudioAnnouncementsCard'
export {StudioAnnouncementsDialog} from '../core/studio/studioAnnouncements/StudioAnnouncementsDialog'
export {
  isValidAnnouncementAudience,
  isValidAnnouncementRole,
} from '../core/studio/studioAnnouncements/utils'
export {type NavbarContextValue} from '../core/studio/StudioLayout'
export {StudioLayoutComponent} from '../core/studio/StudioLayoutComponent'
export {
  recordStructurePaneKind,
  recordStructureTool,
  type StructurePaneKind,
} from '../core/studio/telemetry/paneKindRegistry'
export {useTelemetryConsent} from '../core/studio/telemetry/useTelemetryConsent'
export {
  UpsellDialogDismissed,
  UpsellDialogLearnMoreCtaClicked,
  UpsellDialogUpgradeCtaClicked,
  UpsellDialogViewed,
  type UpsellDialogViewedInfo,
} from '../core/studio/upsell/__telemetry__/upsell.telemetry'
export {type UpsellDataResult} from '../core/studio/upsell/types'
export {UpsellDialog, type UpsellDialogProps} from '../core/studio/upsell/UpsellDialog'
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
export {
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  defaultTheme,
} from '../core/theme'
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
export {getApiErrorCode, isInvalidSessionError, isUnauthorizedError} from '../core/util/apiErrors'
export {catchWithCount} from '../core/util/catchWithCount'
export {type LoadingTuple, type ReactHook} from '../core/util/createHookFromObservableFactory'
export {
  type CollatedHit,
  createDraftFrom,
  createPublishedFrom,
  getIdPair,
  idMatchesPerspective,
  isDraft,
  isSystemBundle,
  isSystemBundleName,
  newDraftFrom,
  removeDupes,
} from '../core/util/draftUtils'
export {EMPTY_ARRAY, EMPTY_OBJECT} from '../core/util/empty'
export {formatRelativeLocale} from '../core/util/formatRelativeLocale'
export {getDocumentVersionVariantId} from '../core/util/getDocumentVersionVariant'
export {getErrorMessage} from '../core/util/getErrorMessage'
export {getTargetDocument, getVariantPublishedSibling} from '../core/util/getTargetDocument'
export {globalScope} from '../core/util/globalScope'
export {isArray} from '../core/util/isArray'
export {isNonNullable} from '../core/util/isNonNullable'
export {isString} from '../core/util/isString'
export {isTruthy} from '../core/util/isTruthy'
export {measureFirstEmission, measureFirstMatch} from '../core/util/measureFirstEmission'
export {type PartialExcept} from '../core/util/PartialExcept'
export {retryTransientFetch} from '../core/util/fetchErrors'
export {reconnectListener, type ReconnectListenerOptions} from '../core/util/reconnectListener'
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
export {
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  useUnique,
} from '../core/util/useUnique'
export {
  type StructureNodeIdValidationResult,
  validateStructureNodeId,
} from '../core/util/validateStructureNodeId'
export {isDocumentInSelectedVariant} from '../core/variants/documents/isDocumentInSelectedVariant'
export {useCreatableVariantInitialValue} from '../core/variants/hooks/useCreatableVariantInitialValue'
export {useVariantDocumentOperations} from '../core/variants/hooks/useVariantDocumentOperations'
export {VARIANTS_STUDIO_CLIENT_OPTIONS} from '../core/variants/store/constants'
export {useAllVariants} from '../core/variants/store/useAllVariants'
export {
  filterVariantsForSearch,
  getVariantTitle,
  isDefaultVariant,
} from '../core/variants/tool/util'
export {encodeVariantLinkParam} from '../core/variants/util/variantSelection'
export {DEFAULT_VARIANT_TYPE_KEY, getVariantType} from '../core/variants/util/variantType'
export {isVariantId} from '../core/variants/types'

export {Rule as ConcreteRuleClass} from '@sanity/validation/_internal'

// From `sanity/structure`
export {createStructureBuilder} from '../structure/structureBuilder/createStructureBuilder'
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
} from '../structure/structureBuilder/MenuItem'
export {maybeSerializeMenuItemGroup} from '../structure/structureBuilder/MenuItemGroup'
export {HELP_URL, SerializeError} from '../structure/structureBuilder/SerializeError'
export {component, form} from '../structure/structureBuilder/views'
export {maybeSerializeView} from '../structure/structureBuilder/views/View'

// Retagged public in this PR, kept here as well. `sanity@6.17.0` through 6.20.0 shipped these on
// this entry and told consumers to migrate to it, so removing them one minor later would break
// exactly the people who followed that advice. A re-export costs nothing at runtime, so this
// entry is a superset: every `@internal` export of a public entry, plus the names that have since
// become public API. The guard test asserts the superset direction only.
export {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../core/studioClient'
export {type DiffComponent} from '../core/field/types'
export {type DiffProps} from '../core/field/types'
export {type GenerateStudioManifestOptions} from '../core/studio/manifest/generateStudioManifest'
export {InsufficientPermissionsMessage} from '../core/components/InsufficientPermissionsMessage'
export {type ListenQueryParams} from '../core/store/document/listenQuery'
export {type ManifestWorkspaceInput} from '../core/studio/manifest/types'
export {type ObjectDiff} from '../core/field/types'
export {Preview} from '../core/preview/components/Preview'
export {PreviewCard} from '../core/components/previewCard/PreviewCard'
export {SanityDefaultPreview} from '../core/preview/components/SanityDefaultPreview'
export {type StudioManifest} from '../core/studio/manifest/types'
export {type StudioWorkspaceManifest} from '../core/studio/manifest/types'
export {collate} from '../core/util/draftUtils'
export {createHookFromObservableFactory} from '../core/util/createHookFromObservableFactory'
export {getPreviewStateObservable} from '../core/preview/utils/getPreviewStateObservable'
export {getPreviewValueWithFallback} from '../core/preview/utils/getPreviewValueWithFallback'
export {getReleaseIdFromReleaseDocumentId} from '../core/releases/util/getReleaseIdFromReleaseDocumentId'
export {isDev} from '../core/environment'
export {isRecord} from '../core/util/isRecord'
export {pathToString} from '../core/field/paths/helpers'
export {pathsAreEqual} from '../core/field/paths/helpers'
export {stringToPath} from '../core/field/paths/helpers'
export {truncateString} from '../core/util/unicodeString'
export {useActiveWorkspace} from '../core/studio/activeWorkspaceMatcher/useActiveWorkspace'
export {useDocumentOperation} from '../core/hooks/useDocumentOperation'
export {useDocumentPairPermissions} from '../core/store/grants/documentPairPermissions'
export {useDocumentPresence} from '../core/store/presence/useDocumentPresence'
export {useDocumentValues} from '../core/store/document/hooks/useDocumentValues'
export {useEditState} from '../core/hooks/useEditState'
export {useRelativeTime} from '../core/hooks/useRelativeTime'
export {useResolveInitialValueForType} from '../core/store/document/useResolveInitialValueForType'
export {useSyncState} from '../core/hooks/useSyncState'
// oxlint-disable-next-line no-deprecated -- deprecated API stays available on the internals entry until it is removed
export {useTimeAgo} from '../core/hooks/useTimeAgo'
export {useTimeZone} from '../core/hooks/useTimeZone'
export {NO_UPSELL_DATA, type UpsellTelemetryLogs, useUpsellData} from '../core/hooks/useUpsellData'
export {useUnstableObserveDocument} from '../core/preview/useObserveDocument'
export {useUserColorManager} from '../core/user-color/hooks'
// oxlint-disable-next-line no-deprecated -- only the boolean overload is deprecated
export {useValidationStatus} from '../core/hooks/useValidationStatus'

export {type HotkeysProps} from '../core/components/Hotkeys'

export {type BlockImagePreviewProps} from '../core/components/previews/portableText/BlockImagePreview'

export {type CompactPreviewProps} from '../core/components/previews/general/CompactPreview'

export {type DefaultPreviewProps} from '../core/components/previews/general/DefaultPreview'

export {type DetailPreviewProps} from '../core/components/previews/general/DetailPreview'

export {type MediaPreviewProps} from '../core/components/previews/general/MediaPreview'

export {type InlinePreviewProps} from '../core/components/previews/portableText/InlinePreview'

// SAPP-5036: moved off the public `sanity` root entry
export {AddonDatasetProvider} from '../core/studio/addonDataset/AddonDatasetProvider'
export {AvatarSkeleton} from '../core/components/userAvatar/UserAvatar'
export {BlockImagePreview} from '../core/components/previews/portableText/BlockImagePreview'
export {BlockPreview} from '../core/components/previews/portableText/BlockPreview'
export {CircularProgress} from '../core/components/progress/CircularProgress'
export {CompactPreview} from '../core/components/previews/general/CompactPreview'
export {CopyPasteProvider} from '../core/studio/copyPaste/CopyPasteProvider'
export {
  DEFAULT_ANNOTATIONS,
  DEFAULT_BLOCK_STYLES,
  DEFAULT_DECORATORS,
  DEFAULT_LIST_TYPES,
} from '@sanity/schema'
export {DRAFTS_FOLDER} from '../core/util/draftUtils'
export {DefaultPreview} from '../core/components/previews/general/DefaultPreview'
export {DetailPreview} from '../core/components/previews/general/DetailPreview'
export {Hotkeys} from '../core/components/Hotkeys'
export {InlinePreview} from '../core/components/previews/portableText/InlinePreview'
export {IntentButton} from '../core/components/IntentButton'
export {LinearProgress} from '../core/components/progress/LinearProgress'
export {MEDIA_LIBRARY_ASSET_ASPECT_TYPE_NAME} from '@sanity/types'
export {MediaPreview} from '../core/components/previews/general/MediaPreview'

export {useCanvasCompanionDoc} from '../core/canvas/actions/useCanvasCompanionDoc'
export {StatusButton, type StatusButtonProps} from '../core/components/StatusButton'
export {
  type RovingFocusNavigationType,
  type RovingFocusProps,
} from '../core/components/rovingFocus/types'
export {useRovingFocus} from '../core/components/rovingFocus/useRovingFocus'
export {UserAvatar, type UserAvatarProps} from '../core/components/userAvatar/UserAvatar'
export {useDialogStack} from '../core/hooks/useDialogStack'
export {useDocumentVersionTitle} from '../core/hooks/useDocumentVersionTitle'
export {useSetImmediateValidation} from '../core/hooks/useSetImmediateValidation'
export {useTemplates} from '../core/hooks/useTemplates'
export {useTools} from '../core/hooks/useTools'
export {useUserListWithPermissions} from '../core/hooks/useUserListWithPermissions'
export {useWorkspaceSchemaId} from '../core/hooks/useWorkspaceSchemaId'
export {useGetDefaultPerspective} from '../core/perspective/useGetDefaultPerspective'
export {ReleaseAvatar, ReleaseAvatarIcon} from '../core/releases/components/ReleaseAvatar'
export {useDocumentVersionTypeSortedList} from '../core/releases/hooks/useDocumentVersionTypeSortedList'
export {useDocumentVersions} from '../core/releases/hooks/useDocumentVersions'
export {useOnlyHasVersions} from '../core/releases/hooks/useOnlyHasVersions'
export {RELEASE_DOCUMENT_TYPE} from '../core/releases/store/constants'
// oxlint-disable-next-line no-deprecated -- will fix in follow up PR
export {useDocumentVersionInfo} from '../core/releases/store/useDocumentVersionInfo'
export {getDocumentIsInPerspective} from '../core/releases/util/util'
export {
  useDocumentPreviewStore,
  useDocumentStore,
  useGrantsStore,
  useHistoryStore,
  usePresenceStore,
  useProjectStore,
  useUserStore,
} from '../core/store/datastores'
export {
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
} from '../core/store/events/types'
export {getDocumentPairPermissions} from '../core/store/grants/documentPairPermissions'
export {useAddonDataset} from '../core/studio/addonDataset/useAddonDataset'
export {useColorSchemeSetValue, useColorSchemeValue} from '../core/studio/colorScheme'
export {StudioNavbar, StudioToolMenu} from '../core/studio/components/navbar/LazyStudioNavbar'
export {StudioLogo} from '../core/studio/components/navbar/StudioLogo'
export {ToolLink} from '../core/studio/components/navbar/tools/ToolLink'
export {useCopyPaste} from '../core/studio/copyPaste/CopyPasteProvider'
export {isTimeoutError} from '../core/studio/requestErrors/classify'
export {useStudioErrorHandler} from '../core/studio/requestErrors/useStudioErrorHandler'
export {
  VERSION_FOLDER,
  documentIdEquals,
  getDraftId,
  getPublishedId,
  getVersionFromId,
  getVersionId,
  isDraftId,
  isPublishedId,
  isVersionId,
  systemBundles,
} from '../core/util/draftUtils'
export {getDocumentVariantType} from '../core/util/getDocumentVariantType'
export {getReferencePaths} from '../core/util/getReferencePaths'
export {userHasRole} from '../core/util/userHasRole'
export {
  isDraftVersion,
  isPublishedVersion,
  isReleaseVersion,
  isVariantVersion,
  readVersionType,
} from '../core/util/versionsUtils'
export {getProviderTitle} from '@sanity/access-ui'
export {
  isCreateIfNotExistsMutation,
  isCreateMutation,
  isCreateOrReplaceMutation,
  isCreateSquashedMutation,
  isDeleteMutation,
  isIndexSegment,
  isIndexTuple,
  isKeySegment,
  isKeyedObject,
  isPatchMutation,
  isSearchStrategy,
  isTitledListValue,
  isValidationError,
  isValidationErrorMarker,
  isValidationInfo,
  isValidationInfoMarker,
  isValidationWarning,
  isValidationWarningMarker,
  searchStrategies,
  typed,
} from '@sanity/types'

// <tombstones>
// Generated by tombstones/generate.mjs from tombstones/manifest.json — do not edit by hand.
// Type-only: every symbol is `export declare` / `export type … = never`. Nothing here may
// emit runtime JavaScript. See AGENTS.md ("Export tombstones (v7)").
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const ArrayOfObjectsInputMember: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const ArrayOfObjectsInputMembers: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type ArrayOfObjectsInputMembersProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type ArrayOfObjectsMemberProps = never
/**
 * @deprecated Removed in v7 with `createAuthStore`. Pass the same options on the workspace `auth` config key.
 */
export type AuthStoreOptions = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-structure`. Import `{BaseResolvedPaneNode}` from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-structure` instead of `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type BaseResolvedPaneNode = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-structure`. Import `{Builder}` from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-structure` instead of `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type Builder = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const COMMENTS_INSPECTOR_NAME: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const ChangeBreadcrumb: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const ChangeConnectorRoot: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type ChangeConnectorRootProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const ChangeFieldWrapper: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const ChangeIndicator: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type ChangeIndicatorProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type ChangeIndicatorTrackerContextValue = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const ChangeIndicatorsTracker: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const ChangeList: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type ChangeListProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const ChangeResolver: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type ChangeResolverProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const ChangeTitleSegment: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const ChangesError: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const Chip: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const CommentDisabledIcon: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const CommentInlineHighlightSpan: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const CommentInput: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type CommentInputHandle = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type CommentInputProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type CommentsSelectedPath = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const CommentsSelectedPathProvider: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const ConfirmDeleteDialog: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-structure`. This export is `@internal` and can change or disappear in any release.
 */
export type ConfirmDeleteDialogProps = never
/**
 * @deprecated Removed in v7: `sanity/presentation` now owns the name `ConnectionStatus` for an unrelated type. The Studio's connection status was the union of `ConnectingStatus`, `ErrorStatus`, `ConnectedStatus` and `RetryingStatus` from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver` (`@internal`, can change or disappear in any release).
 */
export type ConnectionStatus = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type ConnectorContextValue = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const CreateReferenceButton: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type CreateReferenceOption = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const CrossDatasetReferencePreview: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-structure`. Import `{CustomComponentPaneNode}` from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-structure` instead of `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type CustomComponentPaneNode = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const DiffCard: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type DiffCardProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const DiffErrorBoundary: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type DiffErrorBoundaryProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type DiffErrorBoundaryState = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const DiffFromTo: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type DiffFromToProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const DiffInspectWrapper: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type DiffInspectWrapperProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const DiffString: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const DiffStringSegment: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const DiffTooltip: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type DiffTooltipProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type DiffTooltipWithAnnotationsProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type DiffVisitor = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const DivergencesProvider: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type DocumentChangeContextInstance = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type DocumentFormNode = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const DocumentGroupInventory: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type DocumentGroupInventoryComponents = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const DocumentGroupInventoryFeedbackAction: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type DocumentGroupInventoryFeedbackActionProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type DocumentGroupInventoryHandle = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type DocumentGroupInventoryPerspectiveList = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type DocumentGroupInventoryProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type DocumentGroupInventoryReferencePreviewLinkProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-structure`. This export is `@internal` and can change or disappear in any release.
 */
export declare const DocumentInspectorHeader: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const DocumentListPane: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-structure`. Import `{DocumentListPaneNode}` from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-structure` instead of `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type DocumentListPaneNode = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-structure`. This export is `@internal` and can change or disappear in any release.
 */
export type DocumentListPaneProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const DocumentPane: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-structure`. Import `{DocumentPaneNode}` from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-structure` instead of `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type DocumentPaneNode = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-structure`. This export is `@internal` and can change or disappear in any release.
 */
export declare const DocumentPaneProvider: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-structure`. This export is `@internal` and can change or disappear in any release.
 */
export type DocumentPaneProviderProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const DocumentPreviewPresence: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type DocumentPreviewPresenceProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const DocumentVersionIcons: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const DocumentVersionsStatus: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const DocumentVersionsStatusIndicator: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type EditReferenceLinkComponentProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type EditReferenceOptions = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const EditScheduleForm: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const Event: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type ExpandFieldSetOperation = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type ExpandOperation = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type ExpandPathOperation = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const FallbackDiff: never
/**
 * @deprecated Moved to `sanity/_singletons`. Import `{FeedbackContext}` from `sanity/_singletons` instead of `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const FeedbackContext: never
/**
 * @deprecated Moved to `sanity/_singletons`. Import `{FeedbackContextValue}` from `sanity/_singletons` instead of `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type FeedbackContextValue = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const FieldActionMenu: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type FieldActionMenuProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type FieldActionsProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const FieldActionsProvider: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const FieldActionsResolver: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const FieldChange: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type FieldCommentsProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const FieldPresence: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const FieldPresenceInner: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type FieldPresenceInnerProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type FieldPresenceProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const FieldPresenceWithOverlay: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type FieldStatusProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type FieldValueError = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type FormBuilderFilterFieldFn = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const FormCallbacksProvider: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type FormCallbacksValue = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const FormCell: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const FormContainer: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const FormField: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const FormFieldHeaderText: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type FormFieldHeaderTextProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type FormFieldProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const FormFieldSet: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type FormFieldSetProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const FormFieldStatus: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type FormFieldValidation = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type FormFieldValidationError = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type FormFieldValidationInfo = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const FormFieldValidationStatus: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type FormFieldValidationStatusProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type FormFieldValidationWarning = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const FormInput: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type FormInputAbsolutePathArg = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type FormInputRelativePathArg = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const FormRow: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type FormState = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type FormValueContextValue = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const FormValueProvider: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const FromTo: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const FromToArrow: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type FromToArrowDirection = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type FromToProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const GetFormValueProvider: never
/**
 * @deprecated Removed in v7. This was internal document-action plumbing with no public replacement.
 */
export declare const GetHookCollectionState: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type GlobalCopyPasteElementHandler = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const GroupChange: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type HiddenField = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const HoveredFieldProvider: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-router`. Import `{InternalSearchParam}` from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-router` instead of `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type InternalSearchParam = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type IsEqualFunction = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const IsLastPaneProvider: never
/**
 * @deprecated Removed in v7. Build custom studio themes with `buildTheme` from `@sanity/themer` (or `buildTheme` from `@sanity/ui/theme`) and pass the result to the workspace `theme` config key.
 */
export type LegacyThemeTints = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-structure`. Import `{ListPaneNode}` from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-structure` instead of `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type ListPaneNode = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-router`. Import `{MatchError}` from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-router` instead of `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type MatchError = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-router`. Import `{MatchOk}` from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-router` instead of `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type MatchOk = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-router`. Import `{MatchResult}` from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-router` instead of `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type MatchResult = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const MemberField: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const MemberFieldError: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type MemberFieldProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const MemberFieldSet: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const MemberItemError: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const MetaInfo: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type MetaInfoProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type MutationPatch = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-router`. Import `{NextStateOrOptions}` from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-router` instead of `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type NextStateOrOptions = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const NoChanges: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const ORDER_BY_IDS_PARAM_FIELD: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const ObjectInputMember: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type ObjectInputMemberProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const ObjectInputMembers: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const ObjectMembers: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type ObjectMembersProps = never
/**
 * @deprecated Removed in v7. The Studio's document `Operation` type is no longer exported; `sanity/migrate` exports an unrelated `Operation` for migrations.
 */
export type Operation = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const Pane: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const PaneContent: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-structure`. Import `{PaneListItem}` from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-structure` instead of `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type PaneListItem = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-structure`. Import `{PaneListItemDivider}` from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-structure` instead of `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type PaneListItemDivider = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-structure`. Import `{PaneMenuItem}` from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-structure` instead of `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type PaneMenuItem = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-structure`. Import `{PaneMenuItemGroup}` from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-structure` instead of `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type PaneMenuItemGroup = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-structure`. Import `{PaneNode}` from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-structure` instead of `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type PaneNode = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-structure`. Import `{PaneNodeResolver}` from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-structure` instead of `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type PaneNodeResolver = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type ParseError = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const ParseErrorsProvider: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type PortableTextMemberItem = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const PresenceOverlay: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type PresenceOverlayProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const PresenceScope: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type PresenceScopeProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type PrimitiveFieldProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const ReferenceAutocomplete: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type ReferenceInputOptions = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const ReferenceInputOptionsProvider: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type Reported = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type ReporterHook = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const RevertChangesButton: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const RevertChangesConfirmDialog: never
/**
 * @deprecated Moved to `sanity/_singletons`. Import `{RouterContext}` from `sanity/_singletons` instead of `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const RouterContext: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-structure`. Import `{RouterPaneSiblingContext}` from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-structure` instead of `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type RouterPaneSiblingContext = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const SANITY_PATCH_TYPE: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-router`. This export is `@internal` and can change or disappear in any release.
 */
export declare const STICKY_PARAMS: never
/**
 * @deprecated Moved to `sanity/_singletons`. Import `{SchedulesContext}` from `sanity/_singletons` instead of `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export declare const SchedulesContext: never
/**
 * @deprecated Moved to `sanity`. Import `{SchemaError}` from `sanity` instead of `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`.
 */
export declare const SchemaError: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-structure`. Import `{SerializablePaneNode}` from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-structure` instead of `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type SerializablePaneNode = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type SetActiveGroupOperation = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-structure`. Import `{SortMenuItem}` from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-structure` instead of `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type SortMenuItem = never
/**
 * @deprecated Removed from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`: it was a different `StrictVersionLayeringOptions` than the one `sanity` exports, and every export name now comes from exactly one entry. Use the `StrictVersionLayeringOptions` from `sanity`.
 */
export type StrictVersionLayeringOptions = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-structure`. Import `{StructureBuilderOptions}` from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-structure` instead of `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type StructureBuilderOptions = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-structure`. Import `{StructureToolContextValue}` from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-structure` instead of `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type StructureToolContextValue = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-structure`. Import `{StructureToolFeatures}` from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-structure` instead of `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type StructureToolFeatures = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-structure`. Import `{StructureToolPaneActionHandler}` from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-structure` instead of `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type StructureToolPaneActionHandler = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const StructureToolProvider: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type StructureToolProviderProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-1`. This export is `@internal` and can change or disappear in any release.
 */
export declare const StudioDiagnosticsBridge: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-1`. This export is `@internal` and can change or disappear in any release.
 */
export type StudioDiagnosticsBridgeApi = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const TIMELINE_ITEM_I18N_KEY_MAPPING: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type TemplateOption = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-1`. This export is `@internal` and can change or disappear in any release.
 */
export declare const TextWithTone: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-1`. This export is `@internal` and can change or disappear in any release.
 */
export type TextWithToneProps = never
/**
 * @deprecated Removed in v7 with the legacy document history timeline. Document history always uses the events API: `useEventsStore` and `EventsStore` from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver` (`@internal`, can change or disappear in any release).
 */
export type TimelineState = never
/**
 * @deprecated Removed in v7 with the legacy document history timeline. Document history always uses the events API: `useEventsStore` and `EventsStore` from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver` (`@internal`, can change or disappear in any release).
 */
export type TimelineStore = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type TrackedArea = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type TrackedChange = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type TrackerContextGetSnapshot = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type TrackerContextStore = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-structure`. Import `{UnresolvedPaneNode}` from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-structure` instead of `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`. This export is `@internal` and can change or disappear in any release.
 */
export type UnresolvedPaneNode = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const UpdateReadOnlyPlugin: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type UploaderDef = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type UseFormStateOptions = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type UseManageFavoriteProps = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const ValueError: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const VersionChip: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const VersionInlineBadge: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type VirtualizerScrollInstance = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const VirtualizerScrollInstanceProvider: never
/**
 * @deprecated Removed in v7. Use `useReferringDocuments` from `sanity` instead (pass `[]` as the second argument to keep the old full-document shape).
 */
export declare const WithReferringDocuments: never
/**
 * @deprecated Removed in v7. Use the `useRouter` hook from `sanity/router` instead: `const router = useRouter()`.
 */
export declare const WithRouter: never
/**
 * @deprecated Removed in v7 with `withRouter` and `WithRouter`. Use the `useRouter` hook from `sanity/router` instead; its return value is typed as `RouterContextValue` from `sanity/router`.
 */
export type WithRouterProps = never
/**
 * @deprecated Removed in v7. Pass the same options on the workspace `auth` config key directly instead of wrapping them in `createAuthStore()`.
 */
export declare const _createAuthStore: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-router`. This export is `@internal` and can change or disappear in any release.
 */
export declare const _createNode: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const buildCommentRangeDecorations: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const buildRangeDecorationSelectionsFromComments: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const buildTextSelectionFromFragment: never
/**
 * @deprecated Moved to `sanity`. Import `{createDefaultIcon}` from `sanity` instead of `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`.
 */
export declare const createDefaultIcon: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const createPatchChannel: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-router`. This export is `@internal` and can change or disappear in any release.
 */
export declare const decodeJsonParams: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const decodePath: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const defaultRenderAnnotation: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const defaultRenderBlock: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const defaultRenderField: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const defaultRenderInlineBlock: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const defaultRenderInput: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const defaultRenderItem: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const defaultRenderPreview: never
/**
 * @deprecated Moved to `sanity`. Import `{defineDocumentFieldAction}` from `sanity` instead of `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`.
 */
export declare const defineDocumentFieldAction: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const emptyValuesByType: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-router`. This export is `@internal` and can change or disappear in any release.
 */
export declare const encodeJsonParams: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const encodePath: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const fromMutationPatches: never
/**
 * @deprecated Moved to `sanity`. Import `{generateStudioManifest}` from `sanity` instead of `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`.
 */
export declare const generateStudioManifest: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const getAnnotationAtPath: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const getAnnotationColor: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const getCalendarLabels: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export type getDiffAtPath = never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const getExpandOperations: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const getValueError: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const getVersionInlineBadge: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const hasCommentMessageValue: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const isAddedItemDiff: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const isFieldChange: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const isGroupChange: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const isRemovedItemDiff: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const isTextSelectionComment: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const isUnchangedDiff: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const mergeParseErrors: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const noop: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const prefixPath: never
/**
 * @deprecated Moved to `sanity`. Import `{renderStudio}` from `sanity` instead of `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`.
 */
export declare const renderStudio: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const resolveConditionalProperty: never
/**
 * @deprecated Moved to `sanity`. Import `{resolveConfig}` from `sanity` instead of `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`.
 */
export declare const resolveConfig: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const resolveDiffComponent: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const setAtPath: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const toMutationPatches: never
/**
 * @deprecated Moved to `sanity`. Import `{uploadSchema}` from `sanity` instead of `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`.
 */
export declare const uploadSchema: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const useAnnotationColor: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const useChangeIndicatorsReportedValues: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const useChangeIndicatorsReporter: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const useCommentsSelectedPath: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const useCommentsTelemetry: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const useDiffAnnotationColor: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const useDivergenceNavigator: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const useDocumentChange: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const useDocumentDivergences: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const useDocumentForm: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-1`. This export is `@internal` and can change or disappear in any release.
 */
export declare const useDocumentPane: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const useDocumentPreviewValues: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const useEnhancedObjectDialog: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const useFieldActions: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const useFormCallbacks: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const useFormState: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const useGlobalCopyPasteElementHandler: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const useHoveredField: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const useManageFavorite: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const usePaneOptions: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const useParseErrorForPath: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const useParseErrors: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const usePausedScheduledDraft: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const useReferenceInputOptions: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const useReportParseError: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const useReviewChanges: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const useStructureTool: never
/**
 * @deprecated Removed in v7 with the legacy document history timeline. Document history always uses the events API: `useEventsStore` and `EventsStore` from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver` (`@internal`, can change or disappear in any release).
 */
export declare const useTimelineSelector: never
/**
 * @deprecated Removed in v7 with the legacy document history timeline. Document history always uses the events API: `useEventsStore` and `EventsStore` from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver` (`@internal`, can change or disappear in any release).
 */
export declare const useTimelineStore: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const useTrackerStore: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const useTrackerStoreReporter: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const useVirtualizerScrollInstance: never
/**
 * @deprecated Moved to `sanity/_dangerously_use_private_internals_that_do_not_follow_semver-2`. Import it only from code that is loaded lazily (a tool, an input, a document component). This export is `@internal` and can change or disappear in any release.
 */
export declare const visitDiff: never
/**
 * @deprecated Removed in v7. Use the `useRouter` hook from `sanity/router` instead: `const router = useRouter()`.
 */
export declare const withRouter: never
// </tombstones>
