import {fileURLToPath} from 'node:url'

import {expect, it} from 'vitest'
import {getPackageExportsManifest} from 'vitest-package-exports'

const EXCLUDE = [
  // This is causing trouble if running without first "pnpm build"
  // also, it's internal, so not much point in tracking
  './lib/_internal.js',
]

it('exports snapshot', async () => {
  const manifest = await getPackageExportsManifest({
    resolveExportsValue: (entry) => {
      if (typeof entry === 'string') {
        throw new Error('Expected entry to be an object')
      }
      if (EXCLUDE.includes(entry.default)) {
        return undefined
      }
      return entry.source
    },
    importMode: 'src',
    cwd: fileURLToPath(import.meta.url),
  })

  expect(manifest.exports).toMatchInlineSnapshot(`
      {
        ".": {
          "ActiveWorkspaceMatcher": "function",
          "AddonDatasetProvider": "function",
          "ArrayOfObjectOptionsInput": "function",
          "ArrayOfObjectsFunctions": "function",
          "ArrayOfObjectsInput": "function",
          "ArrayOfObjectsInputMember": "function",
          "ArrayOfObjectsInputMembers": "function",
          "ArrayOfObjectsItem": "function",
          "ArrayOfOptionsInput": "function",
          "ArrayOfPrimitiveOptionsInput": "function",
          "ArrayOfPrimitivesFunctions": "function",
          "ArrayOfPrimitivesInput": "function",
          "ArrayOfPrimitivesItem": "function",
          "AutoCollapseMenu": "object",
          "AvatarSkeleton": "object",
          "BasicDocument": "function",
          "BetaBadge": "function",
          "BlockEditor": "function",
          "BlockImagePreview": "function",
          "BlockPreview": "function",
          "BooleanInput": "function",
          "COMMENTS_INSPECTOR_NAME": "string",
          "CONNECTING": "object",
          "ChangeBreadcrumb": "function",
          "ChangeConnectorRoot": "function",
          "ChangeFieldWrapper": "function",
          "ChangeIndicator": "function",
          "ChangeIndicatorsTracker": "object",
          "ChangeList": "function",
          "ChangeResolver": "function",
          "ChangeTitleSegment": "function",
          "ChangesError": "function",
          "CircularProgress": "function",
          "CollapseMenu": "object",
          "CollapseMenuButton": "object",
          "ColorSchemeCustomProvider": "function",
          "ColorSchemeLocalStorageProvider": "function",
          "ColorSchemeProvider": "function",
          "CommandList": "object",
          "CommentDeleteDialog": "function",
          "CommentDisabledIcon": "object",
          "CommentInlineHighlightSpan": "object",
          "CommentInput": "object",
          "CommentsAuthoringPathProvider": "function",
          "CommentsEnabledProvider": "object",
          "CommentsIntentProvider": "object",
          "CommentsList": "object",
          "CommentsProvider": "object",
          "CommentsSelectedPathProvider": "object",
          "CompactPreview": "function",
          "ConcreteRuleClass": "function",
          "ConfigPropertyError": "function",
          "ConfigResolutionError": "function",
          "ContextMenuButton": "object",
          "CopyPasteProvider": "function",
          "CorsOriginError": "function",
          "CrossDatasetReferenceInput": "function",
          "DEFAULT_MAX_RECURSION_DEPTH": "number",
          "DEFAULT_STUDIO_CLIENT_OPTIONS": "object",
          "DRAFTS_FOLDER": "string",
          "DateInput": "function",
          "DateTimeInput": "function",
          "DefaultDocument": "function",
          "DefaultPreview": "function",
          "DetailPreview": "function",
          "DiffCard": "object",
          "DiffErrorBoundary": "function",
          "DiffFromTo": "function",
          "DiffInspectWrapper": "function",
          "DiffString": "function",
          "DiffStringSegment": "function",
          "DiffTooltip": "function",
          "DocumentPreviewPresence": "function",
          "DocumentStatus": "function",
          "DocumentStatusIndicator": "function",
          "EMPTY_ARRAY": "object",
          "EMPTY_OBJECT": "object",
          "EditPortal": "function",
          "EditScheduleForm": "function",
          "EmailInput": "function",
          "ErrorActions": "function",
          "ErrorMessage": "function",
          "Event": "function",
          "EventsProvider": "function",
          "FallbackDiff": "function",
          "FieldActionMenu": "object",
          "FieldActionsProvider": "object",
          "FieldActionsResolver": "object",
          "FieldChange": "function",
          "FieldPresence": "function",
          "FieldPresenceInner": "object",
          "FieldPresenceWithOverlay": "function",
          "FileInput": "function",
          "Filters": "function",
          "FormBuilder": "function",
          "FormCallbacksProvider": "object",
          "FormField": "object",
          "FormFieldHeaderText": "object",
          "FormFieldSet": "object",
          "FormFieldStatus": "function",
          "FormFieldValidationStatus": "function",
          "FormInput": "object",
          "FormProvider": "function",
          "FormValueProvider": "function",
          "FromTo": "object",
          "FromToArrow": "function",
          "GetFormValueProvider": "function",
          "GetHookCollectionState": "object",
          "GlobalErrorHandler": "function",
          "GroupChange": "function",
          "Hotkeys": "function",
          "HoveredFieldProvider": "object",
          "ImageInput": "function",
          "ImperativeToast": "object",
          "InlinePreview": "function",
          "InsufficientPermissionsMessage": "function",
          "IntentButton": "function",
          "IsLastPaneProvider": "function",
          "LATEST": "string",
          "LegacyLayerProvider": "function",
          "LinearProgress": "function",
          "LoadingBlock": "function",
          "LocaleProvider": "function",
          "LocaleProviderBase": "function",
          "MediaPreview": "function",
          "MemberField": "object",
          "MemberFieldError": "function",
          "MemberFieldSet": "object",
          "MemberItemError": "function",
          "MetaInfo": "function",
          "NoChanges": "function",
          "NumberInput": "function",
          "ObjectInput": "object",
          "ObjectInputMember": "object",
          "ObjectInputMembers": "function",
          "ObjectMembers": "function",
          "PatchEvent": "function",
          "PerspectiveProvider": "function",
          "PopoverDialog": "function",
          "PortableTextInput": "function",
          "PresenceOverlay": "function",
          "PresenceScope": "function",
          "Preview": "function",
          "PreviewCard": "object",
          "PreviewLoader": "function",
          "RELEASES_INTENT": "string",
          "RELEASES_STUDIO_CLIENT_OPTIONS": "object",
          "ReferenceInput": "function",
          "ReferenceInputOptionsProvider": "function",
          "ReferenceInputPreviewCard": "object",
          "RelativeTime": "function",
          "ReleaseAvatar": "function",
          "Resizable": "function",
          "ResourceCacheProvider": "function",
          "RevertChangesButton": "object",
          "SANITY_PATCH_TYPE": "symbol",
          "SANITY_VERSION": "string",
          "SESSION_ID": "string",
          "SanityDefaultPreview": "object",
          "ScheduleAction": "function",
          "ScheduledBadge": "function",
          "SchemaError": "function",
          "ScrollContainer": "object",
          "SearchButton": "object",
          "SearchDialog": "function",
          "SearchHeader": "object",
          "SearchPopover": "function",
          "SearchProvider": "function",
          "SearchResultItemPreview": "function",
          "SelectInput": "function",
          "SlugInput": "function",
          "SourceProvider": "function",
          "StatusButton": "object",
          "StringInput": "function",
          "Studio": "function",
          "StudioAnnouncementsCard": "function",
          "StudioAnnouncementsDialog": "function",
          "StudioLayout": "function",
          "StudioLayoutComponent": "function",
          "StudioLogo": "function",
          "StudioNavbar": "function",
          "StudioProvider": "function",
          "StudioToolMenu": "function",
          "TIMELINE_ITEM_I18N_KEY_MAPPING": "object",
          "TagsArrayInput": "function",
          "TelephoneInput": "function",
          "TemplatePreview": "function",
          "TextInput": "function",
          "TextWithTone": "object",
          "Timeline": "function",
          "TimelineController": "function",
          "ToolLink": "object",
          "TooltipOfDisabled": "object",
          "TransformPatches": "object",
          "Translate": "function",
          "UniversalArrayInput": "function",
          "UpsellDescriptionSerializer": "function",
          "UpsellDialogDismissed": "object",
          "UpsellDialogLearnMoreCtaClicked": "object",
          "UpsellDialogUpgradeCtaClicked": "object",
          "UpsellDialogViewed": "object",
          "UrlInput": "function",
          "UserAvatar": "function",
          "UserColorManagerProvider": "function",
          "VERSION_FOLDER": "string",
          "ValueError": "function",
          "VersionChip": "object",
          "VersionInlineBadge": "function",
          "VirtualizerScrollInstanceProvider": "function",
          "WithReferringDocuments": "function",
          "WorkspaceLoader": "function",
          "WorkspaceProvider": "function",
          "WorkspacesProvider": "function",
          "ZIndexProvider": "function",
          "_createAuthStore": "function",
          "_isCustomDocumentTypeDefinition": "function",
          "_isSanityDocumentTypeDefinition": "function",
          "asLoadable": "function",
          "buildCommentRangeDecorations": "function",
          "buildLegacyTheme": "function",
          "buildRangeDecorationSelectionsFromComments": "function",
          "buildTextSelectionFromFragment": "function",
          "checkoutPair": "function",
          "collate": "function",
          "createAuthStore": "function",
          "createBufferedDocument": "function",
          "createConfig": "function",
          "createConnectionStatusStore": "function",
          "createDefaultIcon": "function",
          "createDocumentPreviewStore": "function",
          "createDocumentStore": "function",
          "createDraftFrom": "function",
          "createGrantsStore": "function",
          "createHistoryStore": "function",
          "createHookFromObservableFactory": "function",
          "createKeyValueStore": "function",
          "createMockAuthStore": "function",
          "createObservableBufferedDocument": "function",
          "createPatchChannel": "function",
          "createPlugin": "function",
          "createPresenceStore": "function",
          "createProjectStore": "function",
          "createPublishedFrom": "function",
          "createSWR": "function",
          "createSchema": "function",
          "createSearch": "function",
          "createSharedResizeObserver": "function",
          "createSourceFromConfig": "function",
          "createUserColorManager": "function",
          "createUserStore": "function",
          "createWorkspaceFromConfig": "function",
          "dec": "function",
          "decodePath": "function",
          "defaultLocale": "object",
          "defaultRenderAnnotation": "function",
          "defaultRenderBlock": "function",
          "defaultRenderField": "function",
          "defaultRenderInlineBlock": "function",
          "defaultRenderInput": "function",
          "defaultRenderItem": "function",
          "defaultRenderPreview": "function",
          "defaultTemplateForType": "function",
          "defaultTemplatesForSchema": "function",
          "defaultTheme": "object",
          "defineArrayMember": "function",
          "defineConfig": "function",
          "defineDocumentFieldAction": "function",
          "defineDocumentInspector": "function",
          "defineField": "function",
          "defineLocale": "function",
          "defineLocaleResourceBundle": "function",
          "defineLocalesResources": "function",
          "definePlugin": "function",
          "defineSearchFilter": "function",
          "defineSearchFilterOperators": "function",
          "defineSearchOperator": "function",
          "defineType": "function",
          "diffMatchPatch": "function",
          "diffResolver": "function",
          "documentFieldActionsReducer": "function",
          "documentIdEquals": "function",
          "editState": "function",
          "emitOperation": "function",
          "encodePath": "function",
          "escapeField": "function",
          "fieldNeedsEscape": "function",
          "findIndex": "function",
          "flattenConfig": "function",
          "formatRelativeLocale": "function",
          "formatRelativeLocalePublishDate": "function",
          "fromMutationPatches": "function",
          "getAnnotationAtPath": "function",
          "getAnnotationColor": "function",
          "getCalendarLabels": "function",
          "getConfigContextFromSource": "function",
          "getDiffAtPath": "function",
          "getDocumentPairPermissions": "function",
          "getDocumentValuePermissions": "function",
          "getDocumentVariantType": "function",
          "getDraftId": "function",
          "getExpandOperations": "function",
          "getIdPair": "function",
          "getInitialValueStream": "function",
          "getItemKey": "function",
          "getItemKeySegment": "function",
          "getNamelessWorkspaceIdentifier": "function",
          "getPairListener": "function",
          "getPreviewPaths": "function",
          "getPreviewStateObservable": "function",
          "getPreviewValueWithFallback": "function",
          "getProviderTitle": "function",
          "getPublishedId": "function",
          "getReleaseIdFromReleaseDocumentId": "function",
          "getReleaseTone": "function",
          "getSanityCreateLinkMetadata": "function",
          "getSchemaTypeTitle": "function",
          "getSearchableTypes": "function",
          "getTemplatePermissions": "function",
          "getValueAtPath": "function",
          "getValueError": "function",
          "getVersionFromId": "function",
          "getVersionId": "function",
          "getVersionInlineBadge": "function",
          "getWorkspaceIdentifier": "function",
          "globalScope": "object",
          "grantsPermissionOn": "function",
          "hasCommentMessageValue": "function",
          "inc": "function",
          "initialDocumentFieldActions": "object",
          "insert": "function",
          "isAddedItemDiff": "function",
          "isArray": "function",
          "isArrayOfBlocksInputProps": "function",
          "isArrayOfBlocksSchemaType": "function",
          "isArrayOfObjectsInputProps": "function",
          "isArrayOfObjectsSchemaType": "function",
          "isArrayOfPrimitivesInputProps": "function",
          "isArrayOfPrimitivesSchemaType": "function",
          "isArraySchemaType": "function",
          "isAuthStore": "function",
          "isBlockChildrenObjectField": "function",
          "isBlockListObjectField": "function",
          "isBlockSchemaType": "function",
          "isBlockStyleObjectField": "function",
          "isBooleanInputProps": "function",
          "isBooleanSchemaType": "function",
          "isBuilder": "function",
          "isCookielessCompatibleLoginMethod": "function",
          "isCreateDocumentVersionEvent": "function",
          "isCreateIfNotExistsMutation": "function",
          "isCreateLiveDocumentEvent": "function",
          "isCreateMutation": "function",
          "isCreateOrReplaceMutation": "function",
          "isCreateSquashedMutation": "function",
          "isCrossDatasetReference": "function",
          "isCrossDatasetReferenceSchemaType": "function",
          "isDeleteDocumentGroupEvent": "function",
          "isDeleteDocumentVersionEvent": "function",
          "isDeleteMutation": "function",
          "isDeprecatedSchemaType": "function",
          "isDeprecationConfiguration": "function",
          "isDev": "boolean",
          "isDocumentSchemaType": "function",
          "isDraft": "function",
          "isDraftId": "function",
          "isDraftPerspective": "function",
          "isEditDocumentVersionEvent": "function",
          "isEmptyObject": "function",
          "isFieldChange": "function",
          "isFileSchemaType": "function",
          "isGlobalDocumentReference": "function",
          "isGoingToUnpublish": "function",
          "isGroupChange": "function",
          "isImage": "function",
          "isImageSchemaType": "function",
          "isIndexSegment": "function",
          "isIndexTuple": "function",
          "isKeySegment": "function",
          "isKeyedObject": "function",
          "isNonNullable": "function",
          "isNumberInputProps": "function",
          "isNumberSchemaType": "function",
          "isObjectInputProps": "function",
          "isObjectItemProps": "function",
          "isObjectSchemaType": "function",
          "isPatchMutation": "function",
          "isPerspectiveRaw": "function",
          "isPortableTextListBlock": "function",
          "isPortableTextSpan": "function",
          "isPortableTextTextBlock": "function",
          "isPrimitiveSchemaType": "function",
          "isProd": "boolean",
          "isPublishDocumentVersionEvent": "function",
          "isPublishedId": "function",
          "isPublishedPerspective": "function",
          "isRecord": "function",
          "isReference": "function",
          "isReferenceSchemaType": "function",
          "isReleaseDocument": "function",
          "isReleasePerspective": "function",
          "isReleaseScheduledOrScheduling": "function",
          "isRemovedItemDiff": "function",
          "isSanityCreateExcludedType": "function",
          "isSanityCreateLinked": "function",
          "isSanityCreateLinkedDocument": "function",
          "isSanityCreateStartCompatibleDoc": "function",
          "isSanityDocument": "function",
          "isScheduleDocumentVersionEvent": "function",
          "isSearchStrategy": "function",
          "isSlug": "function",
          "isSpanSchemaType": "function",
          "isString": "function",
          "isStringInputProps": "function",
          "isStringSchemaType": "function",
          "isSystemBundle": "function",
          "isSystemBundleName": "function",
          "isTextSelectionComment": "function",
          "isTitledListValue": "function",
          "isTruthy": "function",
          "isTypedObject": "function",
          "isUnchangedDiff": "function",
          "isUnpublishDocumentEvent": "function",
          "isUnscheduleDocumentVersionEvent": "function",
          "isUpdateLiveDocumentEvent": "function",
          "isValidAnnouncementAudience": "function",
          "isValidAnnouncementRole": "function",
          "isValidationError": "function",
          "isValidationErrorMarker": "function",
          "isValidationInfo": "function",
          "isValidationInfoMarker": "function",
          "isValidationWarning": "function",
          "isValidationWarningMarker": "function",
          "isVersionId": "function",
          "joinPath": "function",
          "listenQuery": "function",
          "matchWorkspace": "function",
          "newDraftFrom": "function",
          "noop": "function",
          "normalizeIndexSegment": "function",
          "normalizeIndexTupleSegment": "function",
          "normalizeKeySegment": "function",
          "normalizePathSegment": "function",
          "onRetry": "function",
          "operationEvents": "function",
          "operatorDefinitions": "object",
          "pathToString": "function",
          "pathsAreEqual": "function",
          "prefixPath": "function",
          "prepareConfig": "function",
          "prepareForPreview": "function",
          "prepareTemplates": "function",
          "remoteSnapshots": "function",
          "removeDupes": "function",
          "removeMissingReferences": "function",
          "removeUndefinedLocaleResources": "function",
          "renderStudio": "function",
          "resizeObserver": "object",
          "resolveConditionalProperty": "function",
          "resolveConfig": "function",
          "resolveDiffComponent": "function",
          "resolveInitialObjectValue": "function",
          "resolveInitialValue": "function",
          "resolveInitialValueForType": "function",
          "resolveSchemaTypes": "function",
          "searchStrategies": "object",
          "serializeError": "function",
          "set": "function",
          "setAtPath": "function",
          "setIfMissing": "function",
          "sliceString": "function",
          "snapshotPair": "function",
          "stringToPath": "function",
          "supportsTouch": "boolean",
          "systemBundles": "object",
          "toMutationPatches": "function",
          "truncateString": "function",
          "typed": "function",
          "uncaughtErrorHandler": "function",
          "unset": "function",
          "unstable_useObserveDocument": "function",
          "unstable_useValuePreview": "function",
          "usEnglishLocale": "object",
          "useActiveReleases": "function",
          "useActiveWorkspace": "function",
          "useAddonDataset": "function",
          "useAnnotationColor": "function",
          "useArchivedReleases": "function",
          "useChangeIndicatorsReportedValues": "function",
          "useChangeIndicatorsReporter": "function",
          "useClient": "function",
          "useColorScheme": "function",
          "useColorSchemeInternalValue": "function",
          "useColorSchemeOptions": "function",
          "useColorSchemeSetValue": "function",
          "useColorSchemeValue": "function",
          "useComments": "function",
          "useCommentsEnabled": "function",
          "useCommentsSelectedPath": "function",
          "useCommentsTelemetry": "function",
          "useConfigContextFromSource": "function",
          "useConnectionState": "function",
          "useConnectionStatusStore": "function",
          "useCopyErrorDetails": "function",
          "useCopyPaste": "function",
          "useCurrentLocale": "function",
          "useCurrentUser": "function",
          "useDataset": "function",
          "useDateTimeFormat": "function",
          "useDidUpdate": "function",
          "useDiffAnnotationColor": "function",
          "useDocumentChange": "function",
          "useDocumentForm": "function",
          "useDocumentOperation": "function",
          "useDocumentOperationEvent": "function",
          "useDocumentPairPermissions": "function",
          "useDocumentPairPermissionsFromHookFactory": "function",
          "useDocumentPresence": "function",
          "useDocumentPreviewStore": "function",
          "useDocumentStore": "function",
          "useDocumentType": "function",
          "useDocumentValuePermissions": "function",
          "useDocumentValues": "function",
          "useDocumentVersionInfo": "function",
          "useDocumentVersionTypeSortedList": "function",
          "useDocumentVersions": "function",
          "useEditState": "function",
          "useEvents": "function",
          "useEventsStore": "function",
          "useExcludedPerspective": "function",
          "useFeatureEnabled": "function",
          "useFieldActions": "function",
          "useFormBuilder": "function",
          "useFormCallbacks": "function",
          "useFormState": "function",
          "useFormValue": "function",
          "useFormattedDuration": "function",
          "useGetFormValue": "function",
          "useGetI18nText": "function",
          "useGlobalCopyPasteElementHandler": "function",
          "useGlobalPresence": "function",
          "useGrantsStore": "function",
          "useHistoryStore": "function",
          "useHoveredField": "function",
          "useI18nText": "function",
          "useInitialValue": "function",
          "useInitialValueResolverContext": "function",
          "useIsReleaseActive": "function",
          "useKeyValueStore": "function",
          "useListFormat": "function",
          "useLoadable": "function",
          "useLocale": "function",
          "useMiddlewareComponents": "function",
          "useNumberFormat": "function",
          "useOnScroll": "function",
          "useOnlyHasVersions": "function",
          "usePerspective": "function",
          "usePresenceStore": "function",
          "usePreviewCard": "function",
          "useProject": "function",
          "useProjectDatasets": "function",
          "useProjectId": "function",
          "useProjectStore": "function",
          "useReferenceInputOptions": "function",
          "useReferringDocuments": "function",
          "useRelativeTime": "function",
          "useReleasesIds": "function",
          "useRenderingContextStore": "function",
          "useResolveInitialValueForType": "function",
          "useResourceCache": "function",
          "useReviewChanges": "function",
          "useRovingFocus": "function",
          "useSanityCreateConfig": "function",
          "useSchema": "function",
          "useSearchMaxFieldDepth": "function",
          "useSearchState": "function",
          "useSetPerspective": "function",
          "useSource": "function",
          "useSyncState": "function",
          "useTemplatePermissions": "function",
          "useTemplatePermissionsFromHookFactory": "function",
          "useTemplates": "function",
          "useThrottledCallback": "function",
          "useTimeAgo": "function",
          "useTimelineSelector": "function",
          "useTimelineStore": "function",
          "useTools": "function",
          "useTrackerStore": "function",
          "useTrackerStoreReporter": "function",
          "useTranslation": "function",
          "useTreeEditingEnabled": "function",
          "useUnique": "function",
          "useUnitFormatter": "function",
          "useUser": "function",
          "useUserColor": "function",
          "useUserColorManager": "function",
          "useUserListWithPermissions": "function",
          "useUserStore": "function",
          "useValidationStatus": "function",
          "useVersionOperations": "function",
          "useVirtualizerScrollInstance": "function",
          "useWorkspace": "function",
          "useWorkspaceLoader": "function",
          "useWorkspaces": "function",
          "useZIndex": "function",
          "userHasRole": "function",
          "validateBasePaths": "function",
          "validateDocument": "function",
          "validateNames": "function",
          "validateWorkspaces": "function",
          "validation": "function",
          "visitDiff": "function",
        },
        "./_createContext": {
          "createContext": "function",
        },
        "./_singletons": {
          "ActiveWorkspaceMatcherContext": "object",
          "AddonDatasetContext": "object",
          "CalendarContext": "object",
          "ChangeIndicatorTrackerContextGetSnapshot": "object",
          "ChangeIndicatorTrackerContextStore": "object",
          "ColorSchemeSetValueContext": "object",
          "ColorSchemeValueContext": "object",
          "CommentInputContext": "object",
          "CommentsAuthoringPathContext": "object",
          "CommentsContext": "object",
          "CommentsEnabledContext": "object",
          "CommentsIntentContext": "object",
          "CommentsOnboardingContext": "object",
          "CommentsSelectedPathContext": "object",
          "CommentsUpsellContext": "object",
          "ConnectorContext": "object",
          "CopyPasteContext": "object",
          "DiffContext": "object",
          "DocumentActionPropsContext": "object",
          "DocumentChangeContext": "object",
          "DocumentFieldActionsContext": "object",
          "DocumentIdContext": "object",
          "DocumentPaneContext": "object",
          "DocumentSheetListContext": "object",
          "EventsContext": "object",
          "FieldActionsContext": "object",
          "FormBuilderContext": "object",
          "FormCallbacksContext": "object",
          "FormFieldPresenceContext": "object",
          "FormValueContext": "object",
          "FreeTrialContext": "object",
          "GetFormValueContext": "object",
          "HoveredFieldContext": "object",
          "IsLastPaneContext": "object",
          "LocaleContext": "object",
          "MentionUserContext": "object",
          "NavbarContext": "object",
          "PaneContext": "object",
          "PaneLayoutContext": "object",
          "PaneRouterContext": "object",
          "PerspectiveContext": "object",
          "PortableTextMarkersContext": "object",
          "PortableTextMemberItemElementRefsContext": "object",
          "PortableTextMemberItemsContext": "object",
          "PresenceContext": "object",
          "PresenceTrackerContextGetSnapshot": "object",
          "PresenceTrackerContextStore": "object",
          "PresentationContext": "object",
          "PresentationDisplayedDocumentContext": "object",
          "PresentationDocumentContext": "object",
          "PresentationNavigateContext": "object",
          "PresentationPanelsContext": "object",
          "PresentationParamsContext": "object",
          "PresentationSharedStateContext": "object",
          "PreviewCardContext": "object",
          "ReferenceInputOptionsContext": "object",
          "ReferenceItemRefContext": "object",
          "ReleasesMetadataContext": "object",
          "ReleasesUpsellContext": "object",
          "ResourceCacheContext": "object",
          "ReviewChangesContext": "object",
          "RouterContext": "object",
          "RouterHistoryContext": "object",
          "SanityCreateConfigContext": "object",
          "SchedulePublishUpsellContext": "object",
          "ScheduledPublishingEnabledContext": "object",
          "SchedulesContext": "object",
          "ScrollContext": "object",
          "SearchContext": "object",
          "SortableItemIdContext": "object",
          "SourceContext": "object",
          "StructureToolContext": "object",
          "StudioAnnouncementContext": "object",
          "TableContext": "object",
          "TasksContext": "object",
          "TasksEnabledContext": "object",
          "TasksNavigationContext": "object",
          "TasksUpsellContext": "object",
          "TreeEditingEnabledContext": "object",
          "UserColorManagerContext": "object",
          "ValidationContext": "object",
          "VirtualizerScrollInstanceContext": "object",
          "WorkspaceContext": "object",
          "WorkspacesContext": "object",
          "ZIndexContext": "object",
          "zIndexContextDefaults": "object",
        },
        "./cli": {
          "createCliConfig": "function",
          "defineCliConfig": "function",
          "getCliClient": "function",
          "getStudioEnvironmentVariables": "function",
        },
        "./desk": {
          "ComponentBuilder": "function",
          "ComponentViewBuilder": "function",
          "ConfirmDeleteDialog": "function",
          "DEFAULT_INTENT_HANDLER": "symbol",
          "DeskToolProvider": "function",
          "DocumentBuilder": "function",
          "DocumentInspectorHeader": "function",
          "DocumentListBuilder": "function",
          "DocumentListItemBuilder": "function",
          "DocumentListPane": "object",
          "DocumentPane": "object",
          "DocumentPaneProvider": "object",
          "DocumentTypeListBuilder": "function",
          "FormViewBuilder": "function",
          "GenericListBuilder": "function",
          "GenericViewBuilder": "function",
          "HELP_URL": "object",
          "InitialValueTemplateItemBuilder": "function",
          "ListBuilder": "function",
          "ListItemBuilder": "function",
          "MenuItemBuilder": "function",
          "MenuItemGroupBuilder": "function",
          "PaneLayout": "function",
          "SerializeError": "function",
          "component": "function",
          "createStructureBuilder": "function",
          "defaultInitialValueTemplateItems": "function",
          "defaultIntentChecker": "function",
          "deskTool": "function",
          "documentFromEditor": "function",
          "documentFromEditorWithInitialValue": "function",
          "form": "function",
          "getOrderingMenuItem": "function",
          "getOrderingMenuItemsForSchemaType": "function",
          "getTypeNamesFromFilter": "function",
          "isDocumentListItem": "function",
          "maybeSerializeInitialValueTemplateItem": "function",
          "maybeSerializeMenuItem": "function",
          "maybeSerializeMenuItemGroup": "function",
          "maybeSerializeView": "function",
          "menuItemsFromInitialValueTemplateItems": "function",
          "shallowIntentChecker": "function",
          "structureLocaleNamespace": "string",
          "useDeskTool": "function",
          "useDocumentPane": "function",
          "useDocumentTitle": "function",
          "usePaneRouter": "function",
        },
        "./migrate": {
          "DEFAULT_MUTATION_CONCURRENCY": "number",
          "MAX_MUTATION_CONCURRENCY": "number",
          "append": "function",
          "at": "function",
          "collectMigrationMutations": "function",
          "create": "function",
          "createIfNotExists": "function",
          "createOrReplace": "function",
          "dec": "function",
          "decodeText": "function",
          "defineMigration": "function",
          "del": "function",
          "delay": "function",
          "delete_": "function",
          "diffMatchPatch": "function",
          "dryRun": "function",
          "filter": "function",
          "fromDocuments": "function",
          "fromExportArchive": "function",
          "fromExportEndpoint": "function",
          "inc": "function",
          "insert": "function",
          "insertAfter": "function",
          "insertBefore": "function",
          "map": "function",
          "parse": "function",
          "parseJSON": "function",
          "patch": "function",
          "prepend": "function",
          "replace": "function",
          "run": "function",
          "safeJsonParser": "function",
          "set": "function",
          "setIfMissing": "function",
          "split": "function",
          "stringify": "function",
          "stringifyJSON": "function",
          "take": "function",
          "toArray": "function",
          "toFetchOptionsIterable": "function",
          "transaction": "function",
          "truncate": "function",
          "unset": "function",
        },
        "./presentation": {
          "ACTION_IFRAME_LOADED": "string",
          "ACTION_IFRAME_REFRESH": "string",
          "ACTION_IFRAME_RELOAD": "string",
          "ACTION_VISUAL_EDITING_OVERLAYS_TOGGLE": "string",
          "defineDocuments": "function",
          "defineLocations": "function",
          "presentationTool": "function",
          "usePresentationNavigate": "function",
          "usePresentationParams": "function",
          "useSharedState": "function",
        },
        "./router": {
          "IntentLink": "object",
          "Link": "object",
          "RouteScope": "function",
          "RouterContext": "object",
          "RouterProvider": "function",
          "STICKY_PARAMS": "object",
          "StateLink": "object",
          "WithRouter": "function",
          "_createNode": "function",
          "decodeJsonParams": "function",
          "encodeJsonParams": "function",
          "route": "object",
          "useIntentLink": "function",
          "useLink": "function",
          "useRouter": "function",
          "useRouterState": "function",
          "useStateLink": "function",
          "withRouter": "function",
        },
        "./structure": {
          "ComponentBuilder": "function",
          "ComponentViewBuilder": "function",
          "ConfirmDeleteDialog": "function",
          "DEFAULT_INTENT_HANDLER": "symbol",
          "DocumentBuilder": "function",
          "DocumentInspectorHeader": "function",
          "DocumentListBuilder": "function",
          "DocumentListItemBuilder": "function",
          "DocumentListPane": "object",
          "DocumentPane": "object",
          "DocumentPaneProvider": "object",
          "DocumentTypeListBuilder": "function",
          "FormViewBuilder": "function",
          "GenericListBuilder": "function",
          "GenericViewBuilder": "function",
          "HELP_URL": "object",
          "InitialValueTemplateItemBuilder": "function",
          "ListBuilder": "function",
          "ListItemBuilder": "function",
          "MenuItemBuilder": "function",
          "MenuItemGroupBuilder": "function",
          "Pane": "object",
          "PaneContent": "object",
          "PaneLayout": "function",
          "PaneRouterContext": "object",
          "SerializeError": "function",
          "StructureToolProvider": "function",
          "component": "function",
          "createStructureBuilder": "function",
          "defaultInitialValueTemplateItems": "function",
          "defaultIntentChecker": "function",
          "documentFromEditor": "function",
          "documentFromEditorWithInitialValue": "function",
          "form": "function",
          "getOrderingMenuItem": "function",
          "getOrderingMenuItemsForSchemaType": "function",
          "getTypeNamesFromFilter": "function",
          "isDocumentListItem": "function",
          "maybeSerializeInitialValueTemplateItem": "function",
          "maybeSerializeMenuItem": "function",
          "maybeSerializeMenuItemGroup": "function",
          "maybeSerializeView": "function",
          "menuItemsFromInitialValueTemplateItems": "function",
          "shallowIntentChecker": "function",
          "structureLocaleNamespace": "string",
          "structureTool": "function",
          "useDocumentPane": "function",
          "useDocumentTitle": "function",
          "usePaneOptions": "function",
          "usePaneRouter": "function",
          "useStructureTool": "function",
        },
      }
    `)
}, 60_000)
