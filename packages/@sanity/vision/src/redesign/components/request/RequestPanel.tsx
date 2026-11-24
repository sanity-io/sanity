import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {PlayIcon} from '@sanity/icons/Play'
import {StopIcon} from '@sanity/icons/Stop'
import {Badge, Button, Hotkeys, Label, Tab, TabList} from '@sanity/ui'
import {Tooltip} from '@sanity/ui/tooltip'
import {
  type MouseEvent,
  type RefObject,
  type SetStateAction,
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from 'react'
import {createPortal} from 'react-dom'
import {type Schema, useSchema} from 'sanity'
import {useTranslation} from 'sanity/i18n'
import {Text, Box, Flex, Icon} from 'ui5'

import {groqExtensions} from '../../../codemirror/extensions'
import {VisionCodeMirror, type VisionCodeMirrorHandle} from '../../../codemirror/VisionCodeMirror'
import {type Params} from '../../../components/VisionGui'
import {visionLocaleNamespace} from '../../../i18n'
import {useVisionTelemetry} from '../../../telemetry/useVisionTelemetry'
import {useAiFeatures} from '../../aiFeatures'
import {useCanFormatQuery} from '../../hooks/useCanFormatQuery'
import {useContentSize} from '../../hooks/useContentSize'
import {useQueryAgent} from '../../hooks/useQueryAgent'
import {type QueryRequestBuilder} from '../../hooks/useQueryRequestBuilder'
import {type ResolvedRequest} from '../../hooks/useResolvedRequest'
import {
  type QueryRequest,
  type VisionParamsView,
  type VisionSavedFunction,
  type VisionTab,
  type VisionTabOptions,
} from '../../store/types'
import {useVisionActor, useVisionSelector} from '../../store/VisionActorContext'
import {selectFunctionLibrary, selectParamsView} from '../../store/visionMachine'
import {formatParams} from '../../util/formatParams'
import {
  functionLibrary,
  NO_QUERY_PARAM_VALUES,
  queryParamValues,
  querySchema,
} from '../../util/groqEditorContext'
import {createGroqFunctionExtensions} from '../../util/groqFunctionEditor'
import {parseGroq, readQueryFunctions, type TextRange} from '../../util/groqFunctions'
import {createGroqLintExtensions, type QueryLintFinding} from '../../util/groqLint'
import {NO_QUERY_PARAM_NAMES, queryParamNames} from '../../util/groqParamCompletions'
import {queryEndSlot} from '../../util/queryEndSlot'
import {isQueryParamName} from '../../util/queryParamName'
import {createQuerySchema} from '../../util/schemaCheck'
import {VISION_SHORTCUTS} from '../../util/shortcuts'
import {ActionRail} from '../ActionRail'
import {AgentActionsTooltip} from '../AgentActionsTooltip'
import {type CollapsiblePanelTab} from '../CollapsiblePanel'
import {useRequestBottomPanel} from '../queryTabLayout'
import * as styles from '../redesign.module.css'
import {FunctionsTab, type QueryEdit} from '../response/FunctionsTab'
import {LintTab} from '../response/LintTab'
import {
  type BottomPanelState,
  SplitWithBottomPanel,
  type SplitWithBottomPanelHandle,
} from '../SplitWithBottomPanel'
import {useTabElementId} from '../tabs/queryTabShown'
import {ApiVersionButton, type RevealedOption} from './ApiVersionButton'
import {EditorCornerActions} from './EditorCornerActions'
import {GenerateQueryBar, type QueryBarMode} from './GenerateQueryBar'
import {GenerateQueryButton} from './GenerateQueryButton'
import {LintFix} from './LintFix'
import {LiveButton} from './LiveButton'
import {OptionsPanel} from './OptionsPanel'
import {ParamsForm} from './ParamsForm'
import {ParamsPanel} from './ParamsPanel'
import {QueryActionsMenu} from './QueryActionsMenu'
import {RequestOverrideChips} from './RequestOverrideChips'

/** The request column's bottom panel starts about as tall as a short params document */
const DEFAULT_BOTTOM_PANEL_SIZE = {columns: 220, stacked: 180, mobile: 160}

export interface RequestPanelProps {
  tab: VisionTab
  params: Params
  request: QueryRequest | null
  buildRequest: QueryRequestBuilder['buildRequest']
  resolved: ResolvedRequest
  isFetching: boolean
  queryEditorRef: RefObject<VisionCodeMirrorHandle | null>
  paramsEditorRef: RefObject<VisionCodeMirrorHandle | null>
  onQueryChange: (query: string) => void
  /** An edit in the params editor; committed after a debounce */
  onParamsChange: (rawParams: string) => void
  /** Params set by the params form, committed right away since the form shows the tab's params */
  onParamsReplace: (rawParams: string) => void
  /**
   * Commits a params edit still waiting in the debounce. The JSON editor unmounts when its tab
   * or the panel closes, and the editor that comes back is seeded from the tab.
   */
  onParamsFlush: () => void
  onOptionsChange: (options: Partial<VisionTabOptions>) => void
  onRun: () => void
  onCancel: () => void
  /** Formats the query in its editor */
  onFormatQuery: () => void
  /**
   * Formats a query for the width of the query editor, as Format does; rejects when it does not
   * parse
   */
  formatForEditor: (query: string) => Promise<string>
  onCopyQuery: () => void
  onCopyParams: () => void
  /** Formats the params in the JSON editor */
  onFormatParams: () => void
  /** Which editor's Copy button reads Copied, after a copy */
  copied: 'query' | 'params' | null
  onToggleAutoRefetch: () => void
  /** The query editor's lint diagnostics, whenever they change */
  onLintFindings: (findings: QueryLintFinding[]) => void
  /** The query editor's lint diagnostics, listed in the Lint tab */
  lintFindings: QueryLintFinding[]
  /** Shows part of the query (a lint finding, a function declaration) in the query editor */
  onRevealRange: (range: TextRange) => void
  /** Changes the query through its editor */
  onEditQuery: (edit: QueryEdit) => void
}

/** Commits on unmount, so a params edit still in the debounce is not dropped with the editor */
function FlushOnUnmount({onUnmount}: {onUnmount: () => void}) {
  const onUnmountEvent = useEffectEvent(onUnmount)
  useEffect(
    () => () => {
      onUnmountEvent()
    },
    [],
  )
  return null
}

/**
 * The request column: the query editor, then Params, Options, Lint and Functions, then the fetch
 * actions. Params is open until another tab is picked. The actions stay under the split, so
 * resizing the panel does not move them.
 */
export function RequestPanel(props: RequestPanelProps) {
  const {
    tab,
    params,
    request,
    buildRequest,
    resolved,
    isFetching,
    queryEditorRef,
    paramsEditorRef,
    onQueryChange,
    onParamsChange,
    onParamsReplace,
    onParamsFlush,
    onOptionsChange,
    onRun,
    onCancel,
    onFormatQuery,
    formatForEditor,
    onCopyQuery,
    onCopyParams,
    onFormatParams,
    copied,
    onToggleAutoRefetch,
    onLintFindings,
    lintFindings,
    onRevealRange,
    onEditQuery,
  } = props
  const {t} = useTranslation(visionLocaleNamespace)
  const telemetry = useVisionTelemetry()
  // The GROQ editor setup, the diagnostics reporting to the Lint tab, and the documentation,
  // completions and extraction of functions, which know the library. Only the library's facet
  // changes when a function is saved; the rest of the setup stays as it is
  const lintExtensions = useMemo(() => createGroqLintExtensions(onLintFindings), [onLintFindings])
  const functionExtensions = useMemo(
    () =>
      createGroqFunctionExtensions({
        reference: t('vision.functions.editor.reference'),
        apiVersion: (version) => t('vision.functions.editor.api-version', {version}),
        deltaOnly: t('vision.functions.editor.delta-only'),
        declaredOn: (line) => t('vision.functions.editor.declared-on', {line}),
        inLibrary: t('vision.functions.editor.in-library'),
        completionDeclared: t('vision.functions.editor.completion-declared'),
        completionLibrary: t('vision.functions.editor.completion-library'),
        extract: t('vision.functions.editor.extract'),
        addFromLibrary: t('vision.functions.editor.add-from-library'),
        useSuggestion: (suggestion) => t('vision.lint.use-suggestion', {suggestion}),
        fieldOf: (types) => t('vision.schema.editor.field-of', {types}),
        systemField: t('vision.schema.editor.system-field'),
        documentType: t('vision.schema.editor.document-type'),
        onApplySuggestion: () => telemetry.lintUsed('fix'),
      }),
    [t, telemetry],
  )
  const library = useVisionSelector(selectFunctionLibrary)
  const schema = useSchema() as Schema | undefined
  const workspaceSchema = useMemo(() => (schema ? createQuerySchema(schema) : undefined), [schema])
  // Names the query editor can complete after `$`. Invalid JSON offers nothing until it parses
  const paramNames = useMemo(() => {
    if (!params.valid || !params.parsed) return NO_QUERY_PARAM_NAMES
    const names = Object.keys(params.parsed).filter(isQueryParamName)
    return names.length === 0 ? NO_QUERY_PARAM_NAMES : names
  }, [params.parsed, params.valid])
  const paramValues = params.valid && params.parsed ? params.parsed : NO_QUERY_PARAM_VALUES
  const {generateQuery: canGenerate, editQuery: canEdit, fixLint: canFixLint} = useAiFeatures()
  // Held here rather than in the Lint tab, so a fix keeps running and loads when that tab closes
  const lintAgent = useQueryAgent({tab, client: resolved.client, formatForEditor})
  // An empty query can be generated, and one with text in it edited: the one button the query
  // has sits under its last line, and so does the prompt bar it opens
  const queryIsEmpty = !tab.query.trim()
  const [barState, setBarMode] = useState<QueryBarMode | null>(null)
  const barMode = barState && (barState === 'edit' ? canEdit : canGenerate) ? barState : null
  const endMode: QueryBarMode | null =
    barMode ?? (queryIsEmpty ? (canGenerate ? 'generate' : null) : canEdit ? 'edit' : null)
  // The bar and the button sit inside the editor's scrolling content
  const [generateSlot] = useState(() => {
    const slot = document.createElement('div')
    slot.className = styles.queryEnd
    slot.dataset.testid = 'vision-query-end'
    return slot
  })
  const generateExtension = useMemo(() => queryEndSlot(generateSlot), [generateSlot])
  const queryExtensions = useMemo(
    () => [
      ...groqExtensions,
      ...lintExtensions,
      ...functionExtensions,
      functionLibrary.of(library),
      queryParamNames.of(paramNames),
      queryParamValues.of(paramValues),
      ...(workspaceSchema ? [querySchema.of(workspaceSchema)] : []),
      ...(endMode ? [generateExtension] : []),
    ],
    [
      endMode,
      functionExtensions,
      generateExtension,
      library,
      lintExtensions,
      paramNames,
      paramValues,
      workspaceSchema,
    ],
  )
  const actorRef = useVisionActor()
  const {state: panelState, setState: setPanelState} = useRequestBottomPanel()
  // Set while applying a panel update that reveals Lint. Logged after commit, so a click that
  // selects the tab and expands the panel counts once, and the state update itself stays pure.
  const lintOpenedRef = useRef(false)
  const setRequestPanelState = useCallback(
    (update: SetStateAction<BottomPanelState>) => {
      setPanelState((current) => {
        const next = typeof update === 'function' ? update(current) : update
        const wasOpen = current.activeTabId === 'lint' && !current.collapsed
        const isOpen = next.activeTabId === 'lint' && !next.collapsed
        if (!wasOpen && isOpen) lintOpenedRef.current = true
        return next
      })
    },
    [setPanelState],
  )
  useEffect(() => {
    if (!lintOpenedRef.current) return
    if (panelState.activeTabId !== 'lint' || panelState.collapsed) return
    lintOpenedRef.current = false
    telemetry.lintUsed('open')
  }, [panelState, telemetry])
  const panelRef = useRef<SplitWithBottomPanelHandle>(null)
  const paramsView = useVisionSelector(selectParamsView)
  const tabElementId = useTabElementId()
  const paramsContentId = tabElementId('vision-request-params-content')
  const paramsJsonTabId = tabElementId('vision-params-view-json')
  const paramsFormTabId = tabElementId('vision-params-view-form')
  const setParamsView = useCallback(
    (view: VisionParamsView) => actorRef.send({type: 'params.view', view}),
    [actorRef],
  )
  const saveFunction = useCallback(
    (fn: VisionSavedFunction) => actorRef.send({type: 'functions.save', fn}),
    [actorRef],
  )
  const removeFunction = useCallback(
    (id: string) => actorRef.send({type: 'functions.remove', id}),
    [actorRef],
  )
  // A declaration without a namespace does not parse for the API; lint says so
  const declaredFunctions = useMemo(
    () =>
      readQueryFunctions(parseGroq(tab.query), tab.query).declarations.filter(
        (declaration) => declaration.namespace !== undefined,
      ),
    [tab.query],
  )

  const querySectionRef = useRef<HTMLDivElement>(null)
  // Closing hands the keyboard back to the query editor, where the bar was opened from
  const closeBar = useCallback(() => {
    setBarMode(null)
    requestAnimationFrame(() =>
      querySectionRef.current
        ?.querySelector<HTMLElement>('[data-testid="vision-query-editor"] .cm-content')
        ?.focus(),
    )
  }, [])

  // The API version button shows the field that changes what it says: the Options tab opens if
  // another was showing, the panel expands if it was collapsed, and once its fields have mounted
  // the API version field (or, while a variant locks it, the wrapper that stands in for it) takes
  // focus, or the perspective while that keeps the queries off the API CDN. The override chips
  // around it show the dataset, perspective or variant field they name.
  const revealOption = useCallback(
    (option: RevealedOption) => {
      setPanelState((current) => ({...current, activeTabId: 'options', collapsed: false}))
      requestAnimationFrame(() => {
        const options = document.getElementById(tabElementId('vision-request-options-panel'))
        const field =
          option !== 'apiVersion'
            ? options?.querySelector<HTMLElement>(
                `[id="${tabElementId(`vision-option-${option}`)}"]`,
              )
            : (options?.querySelector<HTMLElement>(
                'input[data-testid="vision-option-api-version-custom"], [data-testid="vision-option-api-version-custom"] input',
              ) ??
              options?.querySelector<HTMLElement>(
                '[data-testid="vision-option-api-version-wrap"][tabindex]',
              ) ??
              options?.querySelector<HTMLElement>(
                `[id="${tabElementId('vision-option-api-version')}"]`,
              ))
        field?.focus()
      })
    },
    [setPanelState, tabElementId],
  )

  const fitParams = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    panelRef.current?.fitToContent()
  }, [])

  // Format is offered only where it would change something: never for text that does not parse,
  // and again after the editor is resized, since formatting wraps to its width
  const [queryEditorElement, setQueryEditorElement] = useState<HTMLDivElement | null>(null)
  const queryEditorSize = useContentSize(queryEditorElement)
  const canFormatQuery = useCanFormatQuery(tab.query, formatForEditor, queryEditorSize)
  const canFormatParams = useMemo(
    () => paramsView === 'json' && formatParams(tab.rawParams) !== null,
    [paramsView, tab.rawParams],
  )

  const lintCount = lintFindings.length
  const functionCount = declaredFunctions.length
  const panelTabs = useMemo((): CollapsiblePanelTab[] => {
    return [
      {
        id: 'params',
        label: t('params.label'),
        icon: params.valid ? undefined : (
          <Icon icon={ErrorOutlineIcon} muted size={1} tone="critical" />
        ),
        content: (
          <Flex data-vision-params-content="" flexDirection="column">
            <Flex
              alignItems="center"
              gap={2}
              justifyContent="space-between"
              paddingTop={2}
              paddingX={2}
            >
              <TabList aria-label={t('vision.params.view.label')} gap={1}>
                <Tab
                  aria-controls={paramsContentId}
                  fontSize={1}
                  id={paramsJsonTabId}
                  label={t('vision.params.view.json')}
                  onClick={() => setParamsView('json')}
                  onDoubleClick={fitParams}
                  padding={2}
                  selected={paramsView === 'json'}
                />
                <Tab
                  aria-controls={paramsContentId}
                  fontSize={1}
                  id={paramsFormTabId}
                  label={t('vision.params.view.form')}
                  onClick={() => setParamsView('form')}
                  onDoubleClick={fitParams}
                  padding={2}
                  selected={paramsView === 'form'}
                />
              </TabList>
              <EditorCornerActions
                copied={copied === 'params'}
                copyLabel={t('vision.params.copy')}
                formatLabel={canFormatParams ? t('vision.params.format') : undefined}
                onCopy={onCopyParams}
                onFormat={onFormatParams}
                testIdPrefix="vision-params"
              />
            </Flex>
            <Box id={paramsContentId}>
              {paramsView === 'form' ? (
                <ParamsForm onChange={onParamsReplace} params={params} query={tab.query} />
              ) : (
                <>
                  <ParamsPanel
                    editorRef={paramsEditorRef}
                    onChange={onParamsChange}
                    params={params}
                    value={tab.rawParams}
                  />
                  <FlushOnUnmount onUnmount={onParamsFlush} />
                </>
              )}
            </Box>
          </Flex>
        ),
      },
      {
        id: 'options',
        label: t('vision.panel.options'),
        content: (
          <OptionsPanel onChange={onOptionsChange} options={tab.options} resolved={resolved} />
        ),
      },
      {
        id: 'lint',
        label:
          lintCount > 0 ? t('vision.panel.lint-count', {count: lintCount}) : t('vision.panel.lint'),
        // A count of zero stays a plain tab. Any findings use the releases Errors chip: a soft
        // red pill, with the count in the label, in the same row as the other tabs
        muted: lintCount > 0,
        tone: lintCount > 0 ? 'critical' : undefined,
        content: (
          <LintTab
            action={
              canFixLint ? (
                <LintFix
                  agent={lintAgent}
                  client={resolved.client}
                  findings={lintFindings}
                  params={params.valid ? params.parsed : undefined}
                  tab={tab}
                />
              ) : undefined
            }
            findings={lintFindings}
            onReveal={onRevealRange}
          />
        ),
      },
      {
        id: 'functions',
        label:
          functionCount > 0 ? (
            <Flex alignItems="center" as="span" gap={2}>
              {t('vision.panel.functions')}
              <Badge fontSize={0}>{functionCount}</Badge>
            </Flex>
          ) : (
            t('vision.panel.functions')
          ),
        content: (
          <FunctionsTab
            declarations={declaredFunctions}
            library={library}
            onEdit={onEditQuery}
            onRemove={removeFunction}
            onReveal={onRevealRange}
            onSave={saveFunction}
            query={tab.query}
          />
        ),
      },
    ]
  }, [
    canFixLint,
    canFormatParams,
    copied,
    declaredFunctions,
    fitParams,
    lintAgent,
    functionCount,
    library,
    lintCount,
    lintFindings,
    onCopyParams,
    onEditQuery,
    onFormatParams,
    onOptionsChange,
    onParamsChange,
    onParamsFlush,
    onParamsReplace,
    onRevealRange,
    params,
    paramsContentId,
    paramsEditorRef,
    paramsFormTabId,
    paramsJsonTabId,
    paramsView,
    removeFunction,
    resolved,
    saveFunction,
    setParamsView,
    t,
    tab,
  ])

  const runLabel = isFetching ? t('vision.query.stop') : t('action.query-execute')
  // Next to Stop live, the tooltip and accessible name say what Stop stops
  const runDescription = isFetching ? t('vision.query.stop.description') : runLabel

  return (
    <SplitWithBottomPanel
      defaultBottomSize={DEFAULT_BOTTOM_PANEL_SIZE}
      fitOnTabDoubleClick
      footer={
        <ActionRail testId="vision-query-actions">
          <Flex
            alignItems="center"
            className={styles.actionRailChips}
            data-testid="vision-query-action-chips"
            flexBasis="0%"
            flexGrow={1}
            gap={2}
            justifyContent="flex-start"
            minWidth="0"
          >
            <RequestOverrideChips onReveal={revealOption} options={tab.options} resolved={resolved}>
              <ApiVersionButton onReveal={revealOption} resolved={resolved} />
            </RequestOverrideChips>
          </Flex>
          <LiveButton
            active={tab.autoRefetch}
            canFetch={request !== null}
            onToggle={onToggleAutoRefetch}
            supported={resolved.supportsSyncTags}
          />
          <Tooltip
            animate
            content={
              <Flex alignItems="center" gap={2} padding={1}>
                <Text size={1} as="div" trim={true}>
                  {runDescription}
                </Text>
                {!isFetching && <Hotkeys fontSize={0} keys={VISION_SHORTCUTS.fetch.keys} />}
              </Flex>
            }
            placement="top"
            portal
          >
            <Button
              aria-label={runDescription}
              data-testid="vision-fetch-button"
              disabled={!isFetching && !request}
              gap={2}
              icon={isFetching ? StopIcon : PlayIcon}
              mode="default"
              onClick={isFetching ? onCancel : onRun}
              padding={2}
              text={runLabel}
              tone={isFetching ? 'critical' : 'primary'}
            />
          </Tooltip>
          <QueryActionsMenu
            buildRequest={buildRequest}
            request={request}
            resolved={resolved}
            tab={tab}
          />
        </ActionRail>
      }
      id="vision-request"
      onStateChange={setRequestPanelState}
      ref={panelRef}
      state={panelState}
      tabs={panelTabs}
      testId="vision-request-column"
    >
      <Flex className={styles.querySection} ref={querySectionRef}>
        <Box
          className={styles.editorContainer}
          data-testid="vision-query-editor"
          flexBasis="0%"
          flexGrow={1}
          minHeight="0"
          minWidth="0"
          ref={setQueryEditorElement}
        >
          <Box className={styles.paneLabel}>
            <Flex alignItems="center" gap={2}>
              <Label aria-label={t('query.label')} muted size={1}>
                {t('query.label')}
              </Label>
              <Flex alignItems="center" className={styles.labelActions} gap={1}>
                <EditorCornerActions
                  copied={copied === 'query'}
                  copyLabel={t('vision.query.copy')}
                  formatLabel={canFormatQuery ? t('vision.query.format') : undefined}
                  onCopy={onCopyQuery}
                  onFormat={onFormatQuery}
                  testIdPrefix="vision-query"
                />
              </Flex>
            </Flex>
          </Box>
          <VisionCodeMirror
            extensions={queryExtensions}
            initialValue={tab.query}
            onChange={onQueryChange}
            ref={queryEditorRef}
          />
          {endMode &&
            createPortal(
              barMode ? (
                <GenerateQueryBar
                  client={resolved.client}
                  formatForEditor={formatForEditor}
                  mode={barMode}
                  onClose={closeBar}
                  params={params.valid ? params.parsed : undefined}
                  tab={tab}
                />
              ) : (
                <AgentActionsTooltip>
                  <GenerateQueryButton
                    className={styles.queryEndButton}
                    data-testid={endMode === 'edit' ? 'vision-edit-query' : 'vision-generate-query'}
                    onClick={() => setBarMode(endMode)}
                    text={t(endMode === 'edit' ? 'vision.edit.button' : 'vision.generate.button')}
                  />
                </AgentActionsTooltip>
              ),
              generateSlot,
            )}
        </Box>
      </Flex>
    </SplitWithBottomPanel>
  )
}
