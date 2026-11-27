/**
 * Private internals of `sanity` that only code behind a lazy boundary uses: the document stack
 * (forms and inputs, field diffs and change indicators, presence overlays, comments and tasks
 * UI, document panes and other structure panes) and the hooks and dialogs that render inside a
 * tool or a document.
 *
 * A studio renders its shell (the navbar, the tool menu and a tool that is not found) without any
 * of this, so this subpath must never be part of what a studio loads to render `/404`. Import it
 * only from code that is loaded lazily itself: a `lazy()` tool, input or document component, or a
 * dynamic `import()` with destructured names. The `shell-load` test in the `@repo/test-exports`
 * workspace checks built studios for a static import of this subpath.
 *
 * Every export can change or disappear in any release, including patch releases, without notice,
 * without a deprecation period and without being mentioned in the changelog. The contract of
 * `sanity/_dangerously_use_private_internals_that_do_not_follow_semver` applies here too.
 */

export {ChangeFieldWrapper} from '../../core/changeIndicators/ChangeFieldWrapper'
export {
  type ChangeIndicatorProps,
  ChangeIndicator,
} from '../../core/changeIndicators/ChangeIndicator'
export {type ConnectorContextValue} from '../../core/changeIndicators/ConnectorContext'
export {
  ChangeConnectorRoot,
  type ChangeConnectorRootProps,
} from '../../core/changeIndicators/overlay/ChangeConnectorRoot'
export {
  ChangeIndicatorsTracker,
  useChangeIndicatorsReportedValues,
  useChangeIndicatorsReporter,
} from '../../core/changeIndicators/tracker'
export {
  type ChangeIndicatorTrackerContextValue,
  type TrackedArea,
  type TrackedChange,
} from '../../core/changeIndicators/types'
export {CommentDisabledIcon} from '../../core/comments-v2/components/icons/CommentDisabledIcon'
export {CommentDisabledIcon as CommentDisabledIconLegacy} from '../../core/comments/components/icons/CommentDisabledIcon'
export {CommentDeleteDialog} from '../../core/comments-v2/components/CommentDeleteDialog'
export {CommentDeleteDialog as CommentDeleteDialogLegacy} from '../../core/comments/components/CommentDeleteDialog'
export {CommentsList} from '../../core/comments-v2/components/list/CommentsList'
export {CommentsList as CommentsListLegacy} from '../../core/comments/components/list/CommentsList'
export {
  CommentInput,
  type CommentInputHandle,
  type CommentInputProps,
} from '../../core/comments-v2/components/pte/comment-input/CommentInput'
export {
  CommentInput as CommentInputLegacy,
  type CommentInputHandle as CommentInputHandleLegacy,
  type CommentInputProps as CommentInputPropsLegacy,
} from '../../core/comments/components/pte/comment-input/CommentInput'
export {CommentInlineHighlightSpan} from '../../core/comments-v2/components/pte/CommentInlineHighlightSpan'
export {CommentInlineHighlightSpan as CommentInlineHighlightSpanLegacy} from '../../core/comments/components/pte/CommentInlineHighlightSpan'
export {COMMENTS_INSPECTOR_NAME} from '../../core/comments-v2/constants'
export {COMMENTS_INSPECTOR_NAME as COMMENTS_INSPECTOR_NAME_LEGACY} from '../../core/comments/constants'
export {CommentsAuthoringPathProvider} from '../../core/comments-v2/context/authoring-path/CommentsAuthoringPathProvider'
export {CommentsAuthoringPathProvider as CommentsAuthoringPathProviderLegacy} from '../../core/comments/context/authoring-path/CommentsAuthoringPathProvider'
export {CommentsProvider} from '../../core/comments-v2/context/comments/CommentsProvider'
export {CommentsProvider as CommentsProviderLegacy} from '../../core/comments/context/comments/CommentsProvider'
export {CommentsEnabledProvider} from '../../core/comments-v2/context/enabled/CommentsEnabledProvider'
export {CommentsEnabledProvider as CommentsEnabledProviderLegacy} from '../../core/comments/context/enabled/CommentsEnabledProvider'
export {CommentsIntentProvider} from '../../core/comments/context/intent/CommentsIntentProvider'
export {CommentsSelectedPathProvider} from '../../core/comments-v2/context/selected-path/CommentsSelectedPathProvider'
export {CommentsSelectedPathProvider as CommentsSelectedPathProviderLegacy} from '../../core/comments/context/selected-path/CommentsSelectedPathProvider'
export {type CommentsSelectedPath} from '../../core/comments-v2/context/selected-path/types'
export {type CommentsSelectedPath as CommentsSelectedPathLegacy} from '../../core/comments/context/selected-path/types'
export {hasCommentMessageValue, isTextSelectionComment} from '../../core/comments-v2/helpers'
export {
  hasCommentMessageValue as hasCommentMessageValueLegacy,
  isTextSelectionComment as isTextSelectionCommentLegacy,
} from '../../core/comments/helpers'
export {useComments} from '../../core/comments-v2/hooks/useComments'
export {useComments as useCommentsLegacy} from '../../core/comments/hooks/useComments'
export {useCommentsEnabled} from '../../core/comments-v2/hooks/useCommentsEnabled'
export {useCommentsEnabled as useCommentsEnabledLegacy} from '../../core/comments/hooks/useCommentsEnabled'
export {useCommentsSelectedPath} from '../../core/comments-v2/hooks/useCommentsSelectedPath'
export {useCommentsSelectedPath as useCommentsSelectedPathLegacy} from '../../core/comments/hooks/useCommentsSelectedPath'
export {useCommentsTelemetry} from '../../core/comments-v2/hooks/useCommentsTelemetry'
export {useCommentsTelemetry as useCommentsTelemetryLegacy} from '../../core/comments/hooks/useCommentsTelemetry'
export {buildCommentRangeDecorations} from '../../core/comments-v2/utils/inline-comments/buildCommentRangeDecorations'
export {buildCommentRangeDecorations as buildCommentRangeDecorationsLegacy} from '../../core/comments/utils/inline-comments/buildCommentRangeDecorations'
export {buildRangeDecorationSelectionsFromComments} from '../../core/comments-v2/utils/inline-comments/buildRangeDecorationSelectionsFromComments'
export {buildRangeDecorationSelectionsFromComments as buildRangeDecorationSelectionsFromCommentsLegacy} from '../../core/comments/utils/inline-comments/buildRangeDecorationSelectionsFromComments'
export {buildTextSelectionFromFragment} from '../../core/comments-v2/utils/inline-comments/buildTextSelectionFromFragment'
export {buildTextSelectionFromFragment as buildTextSelectionFromFragmentLegacy} from '../../core/comments/utils/inline-comments/buildTextSelectionFromFragment'
export {DocumentVersionIcons} from '../../core/components/documentStatus/DocumentVersionIcons'
export {DocumentVersionsStatus} from '../../core/components/documentStatus/DocumentVersionsStatus'
export {DocumentVersionsStatusIndicator} from '../../core/components/documentStatusIndicator/DocumentVersionsStatusIndicator'
export {DatePicker} from '../../core/components/inputs/DateInputs/DatePicker'
export {
  type TrackerContextGetSnapshot,
  type TrackerContextStore,
  useTrackerStore,
  useTrackerStoreReporter,
} from '../../core/components/react-track-elements/hooks'
export {
  type IsEqualFunction,
  type Reported,
  type ReporterHook,
} from '../../core/components/react-track-elements/types'
export {useDivergenceNavigator} from '../../core/divergence/divergenceNavigator'
export {
  DocumentGroupInventory,
  type DocumentGroupInventoryHandle,
  type DocumentGroupInventoryProps,
} from '../../core/documentGroupInventory/components/DocumentGroupInventory'
export {
  DocumentGroupInventoryFeedbackAction,
  type DocumentGroupInventoryFeedbackActionProps,
} from '../../core/documentGroupInventory/components/DocumentGroupInventoryFeedbackAction'
export {
  type DocumentGroupInventoryComponents,
  type DocumentGroupInventoryPerspectiveList,
  type DocumentGroupInventoryReferencePreviewLinkProps,
} from '../../core/documentGroupInventory/types'
export {
  type DiffVisitor,
  getAnnotationAtPath,
  getAnnotationColor,
  visitDiff,
  getDiffAtPath,
} from '../../core/field/diff/annotations/helpers'
export {ChangeBreadcrumb} from '../../core/field/diff/components/ChangeBreadcrumb'
export {type ChangeListProps, ChangeList} from '../../core/field/diff/components/ChangeList'
export {
  ChangeResolver,
  type ChangeResolverProps,
  GroupChange,
} from '../../core/field/diff/components/ChangeResolver'
export {ChangesError} from '../../core/field/diff/components/ChangesError'
export {ChangeTitleSegment} from '../../core/field/diff/components/ChangeTitleSegment'
export {TIMELINE_ITEM_I18N_KEY_MAPPING} from '../../core/field/diff/components/constants'
export {type DiffCardProps, DiffCard} from '../../core/field/diff/components/DiffCard'
export {
  DiffErrorBoundary,
  type DiffErrorBoundaryProps,
  type DiffErrorBoundaryState,
} from '../../core/field/diff/components/DiffErrorBoundary'
export {type DiffFromToProps, DiffFromTo} from '../../core/field/diff/components/DiffFromTo'
export {
  DiffInspectWrapper,
  type DiffInspectWrapperProps,
} from '../../core/field/diff/components/DiffInspectWrapper'
export {DiffString, DiffStringSegment} from '../../core/field/diff/components/DiffString'
export {
  type DiffTooltipProps,
  type DiffTooltipWithAnnotationsProps,
  DiffTooltip,
} from '../../core/field/diff/components/DiffTooltip'
export {Event} from '../../core/field/diff/components/Event'
export {FallbackDiff} from '../../core/field/diff/components/FallbackDiff'
export {FieldChange} from '../../core/field/diff/components/FieldChange'
export {FromTo, type FromToProps} from '../../core/field/diff/components/FromTo'
export {FromToArrow, type FromToArrowDirection} from '../../core/field/diff/components/FromToArrow'
export {MetaInfo, type MetaInfoProps} from '../../core/field/diff/components/MetaInfo'
export {NoChanges} from '../../core/field/diff/components/NoChanges'
export {RevertChangesButton} from '../../core/field/diff/components/RevertChangesButton'
export {RevertChangesConfirmDialog} from '../../core/field/diff/components/RevertChangesConfirmDialog'
export {ValueError} from '../../core/field/diff/components/ValueError'
export {type DocumentChangeContextInstance} from '../../core/field/diff/contexts/DocumentChangeContext'
export {
  emptyValuesByType,
  isAddedItemDiff,
  isFieldChange,
  isGroupChange,
  isRemovedItemDiff,
  isUnchangedDiff,
  noop,
} from '../../core/field/diff/helpers'
export {useDocumentChange} from '../../core/field/diff/hooks/useDocumentChange'
export {resolveDiffComponent} from '../../core/field/diff/resolve/resolveDiffComponent'
export {type FieldValueError, getValueError} from '../../core/field/validation'
export {type FormFieldProps} from '../../core/form/components/formField/FormField'
export {
  type FormFieldHeaderTextProps,
  FormFieldHeaderText,
} from '../../core/form/components/formField/FormFieldHeaderText'
export {
  FormFieldSet,
  type FormFieldSetProps,
} from '../../core/form/components/formField/FormFieldSet'
export {
  type FieldStatusProps,
  FormFieldStatus,
} from '../../core/form/components/formField/FormFieldStatus'
export {
  type FormFieldValidationStatusProps,
  FormFieldValidationStatus,
} from '../../core/form/components/formField/FormFieldValidationStatus'
export {
  type FormFieldValidation,
  type FormFieldValidationError,
  type FormFieldValidationInfo,
  type FormFieldValidationWarning,
} from '../../core/form/components/formField/types'
export {
  type FormInputAbsolutePathArg,
  type FormInputRelativePathArg,
} from '../../core/form/components/FormInput'
export {FormCell} from '../../core/form/components/layout/FormCell'
export {FormContainer} from '../../core/form/components/layout/FormContainer'
export {FormRow} from '../../core/form/components/layout/FormRow'
export {
  DivergencesProvider,
  useDocumentDivergences,
} from '../../core/form/contexts/DivergencesProvider'
export {type FormValueContextValue, FormValueProvider} from '../../core/form/contexts/FormValue'
export {GetFormValueProvider} from '../../core/form/contexts/GetFormValue'
export {
  FieldActionMenu,
  type FieldActionMenuProps,
} from '../../core/form/field/actions/FieldActionMenu'
export {FieldActionsProvider} from '../../core/form/field/actions/FieldActionsProvider'
export {
  type FieldActionsProps,
  FieldActionsResolver,
} from '../../core/form/field/actions/FieldActionsResolver'
export {useFieldActions} from '../../core/form/field/actions/useFieldActions'
export {HoveredFieldProvider} from '../../core/form/field/HoveredFieldProvider'
export {useHoveredField} from '../../core/form/field/useHoveredField'
export {
  useVirtualizerScrollInstance,
  type VirtualizerScrollInstance,
} from '../../core/form/inputs/arrays/ArrayOfObjectsInput/List/useVirtualizerScrollInstance'
export {CrossDatasetReferencePreview} from '../../core/form/inputs/CrossDatasetReferenceInput/CrossDatasetReferencePreview'
export {getCalendarLabels} from '../../core/form/inputs/DateInputs/utils'
export {
  type PortableTextMemberItem,
  UpdateReadOnlyPlugin,
} from '../../core/form/inputs/PortableText/PortableTextInput'
export {CreateButton as CreateReferenceButton} from '../../core/form/inputs/ReferenceInput/CreateButton'
export {ReferenceAutocomplete} from '../../core/form/inputs/ReferenceInput/ReferenceAutocomplete'
export {type CreateReferenceOption} from '../../core/form/inputs/ReferenceInput/types'
export {
  MemberFieldSet,
  ObjectInputMembers,
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  ObjectMembers,
  FormBuilder,
  FormProvider,
  ArrayOfObjectOptionsInput,
  ArrayOfObjectsItem,
  ArrayOfOptionsInput,
  ArrayOfPrimitiveOptionsInput,
  ArrayOfPrimitivesInput,
  ArrayOfPrimitivesItem,
  CrossDatasetReferenceInput,
  DateInput,
  DateTimeInput,
  EnhancedObjectDialog,
  FileInput,
  FormField,
  FormInput,
  ImageInput,
  PortableTextInput as BlockEditor,
  ArrayOfObjectsInput,
  ObjectInput,
  PortableTextInput,
  ReferenceInput,
  SlugInput,
  StringInput,
  TagsArrayInput,
  UniversalArrayInput,
  MemberField,
  MemberFieldError,
  ObjectInputMember,
} from '../../core/form/lazy'
export {
  ArrayOfObjectsInputMember,
  type ArrayOfObjectsMemberProps,
} from '../../core/form/members/array/ArrayOfObjectsInputMember'
export {
  ArrayOfObjectsInputMembers,
  type ArrayOfObjectsInputMembersProps,
} from '../../core/form/members/array/ArrayOfObjectsInputMembers'
export {type MemberFieldProps} from '../../core/form/members/object/MemberField'
export {type ObjectInputMemberProps} from '../../core/form/members/object/ObjectInputMember'
export {type ObjectMembersProps} from '../../core/form/members/object/ObjectInputMembers'
export {prefixPath, SANITY_PATCH_TYPE} from '../../core/form/patch/patch'
export {resolveConditionalProperty} from '../../core/form/store/conditional-property/resolveConditionalProperty'
export {setAtPath} from '../../core/form/store/stateTreeHelper'
export {type DocumentFormNode, type HiddenField} from '../../core/form/store/types/nodes'
export {
  type FormState,
  useFormState,
  type UseFormStateOptions,
} from '../../core/form/store/useFormState'
export {
  type ExpandFieldSetOperation,
  type ExpandOperation,
  type ExpandPathOperation,
  getExpandOperations,
  type SetActiveGroupOperation,
} from '../../core/form/store/utils/getExpandOperations'
export {mergeParseErrors, type ParseError} from '../../core/form/store/utils/mergeParseErrors'
export {
  type FormCallbacksValue,
  FormCallbacksProvider,
  useFormCallbacks,
} from '../../core/form/studio/contexts/FormCallbacks'
export {
  ParseErrorsProvider,
  useParseErrorForPath,
  useParseErrors,
  useReportParseError,
} from '../../core/form/studio/contexts/ParseErrors'
export {
  type EditReferenceLinkComponentProps,
  type EditReferenceOptions,
  type ReferenceInputOptions,
  ReferenceInputOptionsProvider,
  type TemplateOption,
  useReferenceInputOptions,
} from '../../core/form/studio/contexts/ReferenceInputOptions'
export {
  defaultRenderAnnotation,
  defaultRenderBlock,
  defaultRenderField,
  defaultRenderInlineBlock,
  defaultRenderInput,
  defaultRenderItem,
  defaultRenderPreview,
} from '../../core/form/studio/defaults'
export {
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  useEnhancedObjectDialog,
} from '../../core/form/studio/tree-editing/context/enabled/useEnhancedObjectDialog'
export {type UploaderDef} from '../../core/form/studio/uploads/types'
export {type FormBuilderFilterFieldFn} from '../../core/form/types/_transitional'
export {
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  type FieldCommentsProps,
  type PrimitiveFieldProps,
} from '../../core/form/types/fieldProps'
export {useDocumentForm} from '../../core/form/useDocumentForm'
export {
  type MutationPatch,
  toMutationPatches,
  fromMutationPatches,
} from '../../core/form/utils/mutationPatch'
export {decodePath, encodePath} from '../../core/form/utils/path'
export {
  type GlobalCopyPasteElementHandler,
  useGlobalCopyPasteElementHandler,
} from '../../core/hooks/useGlobalCopyPasteElementHandler'
export {useManageFavorite, type UseManageFavoriteProps} from '../../core/hooks/useManageFavorite'
export {useReviewChanges} from '../../core/hooks/useReviewChanges'
export {
  type DocumentPreviewPresenceProps,
  DocumentPreviewPresence,
} from '../../core/presence/DocumentPreviewPresence'
export {
  FieldPresence,
  FieldPresenceInner,
  type FieldPresenceInnerProps,
  type FieldPresenceProps,
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  FieldPresenceWithOverlay,
} from '../../core/presence/FieldPresence'
export {
  type PresenceOverlayProps,
  PresenceOverlay,
} from '../../core/presence/overlay/PresenceOverlay'
export {PresenceScope, type PresenceScopeProps} from '../../core/presence/PresenceScope'
export {Chip} from '../../core/releases/components/Chip'
export {VersionChip} from '../../core/releases/components/documentHeader/VersionChip'
export {
  getVersionInlineBadge,
  VersionInlineBadge,
} from '../../core/releases/components/VersionInlineBadge'
// oxlint-disable-next-line eslint/no-restricted-imports, no-deprecated -- deprecated scheduled-publishing API stays public until it is removed
export {EditScheduleForm} from '../../core/scheduled-publishing/components/editScheduleForm/EditScheduleForm'
export {usePausedScheduledDraft} from '../../core/singleDocRelease/hooks/usePausedScheduledDraft'
export {IsLastPaneProvider} from '../../core/tasks/context/isLastPane/IsLastPaneProvider'
export {useDocumentPreviewValues} from '../../core/tasks/hooks/useDocumentPreviewValues'
export {ConfirmDeleteDialog} from '../../structure/components/confirmDeleteDialog'
export {Pane} from '../../structure/components/pane/Pane'
export {PaneContent} from '../../structure/components/pane/PaneContent'
export {DocumentPane} from '../../structure/panes/document/DocumentPane'
export {usePaneOptions} from '../../structure/panes/document/usePaneOptions'
export {ORDER_BY_IDS_PARAM_FIELD} from '../../structure/panes/documentList/orderByIdsParam'
export {PaneContainer as DocumentListPane} from '../../structure/panes/documentList/PaneContainer'
export {
  StructureToolProvider,
  type StructureToolProviderProps,
} from '../../structure/StructureToolProvider'
export {useStructureTool} from '../../structure/useStructureTool'
export {MemberItemError} from '../../core/form/members/array/MemberItemError'
export {VirtualizerScrollInstanceProvider} from '../../core/form/inputs/arrays/ArrayOfObjectsInput/List/VirtualizerScrollInstanceProvider'
export {createPatchChannel} from '../../core/form/patch/PatchChannel'
export {useAnnotationColor, useDiffAnnotationColor} from '../../core/field/diff/annotations/hooks'
export {ALL_FIELDS_GROUP} from '../../core/form/store/constants'
export {ArrayOfObjectsFunctions} from '../../core/form/inputs/arrays/ArrayOfObjectsInput/ArrayOfObjectsFunctions'
export {ArrayOfPrimitivesFunctions} from '../../core/form/inputs/arrays/ArrayOfPrimitivesInput/ArrayOfPrimitivesFunctions'
export {BooleanInput} from '../../core/form/inputs/BooleanInput'
// oxlint-disable-next-line no-deprecated -- deprecated API stays available on the internals entry until it is removed
export {DocumentStatus} from '../../core/components/documentStatus/DocumentStatus'
// oxlint-disable-next-line no-deprecated -- deprecated API stays available on the internals entry until it is removed
export {DocumentStatusIndicator} from '../../core/components/documentStatusIndicator/DocumentStatusIndicator'
export {EditPortal} from '../../core/form/components/EditPortal'
export {EmailInput} from '../../core/form/inputs/EmailInput'
export {useCommentsMode} from '../../core/comments-v2/hooks/useCommentsMode'
export {useCommentsMode as useCommentsModeLegacy} from '../../core/comments/hooks/useCommentsMode'
export {TemplatePreview} from '../../core/components/previews/template/TemplatePreview'
export {useDidUpdate} from '../../core/form/hooks/useDidUpdate'
export {NumberInput} from '../../core/form/inputs/NumberInput/NumberInput'
export {SelectInput} from '../../core/form/inputs/SelectInput'
export {TelephoneInput} from '../../core/form/inputs/TelephoneInput'
export {TextInput} from '../../core/form/inputs/TextInput'
export {UrlInput} from '../../core/form/inputs/UrlInput'
export {PatchEvent} from '../../core/form/patch/PatchEvent'
export {useFormBuilder} from '../../core/form/useFormBuilder'
export {TransformPatches} from '../../core/form/utils/TransformPatches'
// oxlint-disable-next-line eslint/no-restricted-imports, no-deprecated -- deprecated scheduled-publishing API kept until it is removed
export {useScheduleAction as ScheduleAction} from '../../core/scheduled-publishing/plugin/documentActions/schedule/ScheduleAction'
// oxlint-disable-next-line eslint/no-restricted-imports, no-deprecated -- deprecated scheduled-publishing API kept until it is removed
export {ScheduledBadge} from '../../core/scheduled-publishing/plugin/documentBadges/scheduled/ScheduledBadge'
