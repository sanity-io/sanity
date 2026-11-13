import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {PlayIcon} from '@sanity/icons/Play'
import {StopIcon} from '@sanity/icons/Stop'
import {Badge, Button, Hotkeys, Label, Tab, TabList} from '@sanity/ui'
import {Tooltip} from '@sanity/ui/tooltip'
import {
  type MouseEvent,
  type RefObject,
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  useEffectEvent,
} from 'react'
import {type Schema, useSchema, useTranslation} from 'sanity'
import {Text, Box, Flex, Icon} from 'ui5'

import {groqExtensions} from '../../../codemirror/extensions'
import {VisionCodeMirror, type VisionCodeMirrorHandle} from '../../../codemirror/VisionCodeMirror'
import {type Params} from '../../../components/VisionGui'
import {visionLocaleNamespace} from '../../../i18n'
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
import {functionLibrary, querySchema} from '../../util/groqEditorContext'
import {createGroqFunctionExtensions} from '../../util/groqFunctionEditor'
import {parseGroq, readQueryFunctions, type TextRange} from '../../util/groqFunctions'
import {createGroqLintExtensions, type QueryLintFinding} from '../../util/groqLint'
import {createQuerySchema} from '../../util/schemaCheck'
import {VISION_SHORTCUTS} from '../../util/shortcuts'
import {ActionRail} from '../ActionRail'
import {AgentActionsTooltip} from '../AgentActionsTooltip'
import {type CollapsiblePanelTab} from '../CollapsiblePanel'
import * as styles from '../redesign.module.css'
import {useRequestBottomPanel} from '../requestBottomPanel'
import {FunctionsTab, type QueryEdit} from '../response/FunctionsTab'
import {LintTab} from '../response/LintTab'
import {SplitWithBottomPanel, type SplitWithBottomPanelHandle} from '../SplitWithBottomPanel'
import {ApiVersionButton, type RevealedOption} from './ApiVersionButton'
import {GenerateQueryBar} from './GenerateQueryBar'
import {GenerateQueryButton} from './GenerateQueryButton'
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
  onPrettify: () => void
  /**
   * Formats a query for the width of the query editor, as Prettify does; rejects when it does not
   * parse
   */
  formatForEditor: (query: string) => Promise<string>
  onCopyQuery: () => void
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
    onPrettify,
    formatForEditor,
    onCopyQuery,
    onToggleAutoRefetch,
    onLintFindings,
    lintFindings,
    onRevealRange,
    onEditQuery,
  } = props
  const {t} = useTranslation(visionLocaleNamespace)
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
      }),
    [t],
  )
  const library = useVisionSelector(selectFunctionLibrary)
  const schema = useSchema() as Schema | undefined
  const workspaceSchema = useMemo(() => (schema ? createQuerySchema(schema) : undefined), [schema])
  const queryExtensions = useMemo(
    () => [
      ...groqExtensions,
      ...lintExtensions,
      ...functionExtensions,
      functionLibrary.of(library),
      ...(workspaceSchema ? [querySchema.of(workspaceSchema)] : []),
    ],
    [functionExtensions, library, lintExtensions, workspaceSchema],
  )
  const actorRef = useVisionActor()
  const {state: panelState, setState: setPanelState} = useRequestBottomPanel()
  const panelRef = useRef<SplitWithBottomPanelHandle>(null)
  const paramsView = useVisionSelector(selectParamsView)
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
  const [generatorOpen, setGeneratorOpen] = useState(false)
  // Closing hands the keyboard back to the query editor, where the bar was opened from
  const closeGenerator = useCallback(() => {
    setGeneratorOpen(false)
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
  // next to it show the dataset, perspective or variant field they name.
  const revealOption = useCallback(
    (option: RevealedOption) => {
      setPanelState((current) => ({...current, activeTabId: 'options', collapsed: false}))
      requestAnimationFrame(() => {
        const options = document.getElementById('vision-request-options-panel')
        const field =
          option !== 'apiVersion'
            ? options?.querySelector<HTMLElement>(`#vision-option-${option}`)
            : (options?.querySelector<HTMLElement>(
                'input[data-testid="vision-option-api-version-custom"], [data-testid="vision-option-api-version-custom"] input',
              ) ??
              options?.querySelector<HTMLElement>(
                '[data-testid="vision-option-api-version-wrap"][tabindex]',
              ) ??
              options?.querySelector<HTMLElement>('#vision-option-api-version'))
        field?.focus()
      })
    },
    [setPanelState],
  )

  const fitParams = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    panelRef.current?.fitToContent()
  }, [])

  const lintCount = lintFindings.length
  const functionCount = declaredFunctions.length
  const panelTabs = useMemo((): CollapsiblePanelTab[] => {
    const fitTitle = t('vision.panel.fit-content')
    return [
      {
        id: 'params',
        label: t('params.label'),
        icon: params.valid ? undefined : (
          <Icon icon={ErrorOutlineIcon} muted size={1} tone="critical" />
        ),
        content: (
          <Flex flexDirection="column">
            <Flex justifyContent="flex-start" paddingTop={2} paddingX={2}>
              <TabList aria-label={t('vision.params.view.label')} gap={1}>
                <Tab
                  aria-controls="vision-request-params-content"
                  fontSize={1}
                  id="vision-params-view-json"
                  label={t('vision.params.view.json')}
                  onClick={() => setParamsView('json')}
                  onDoubleClick={fitParams}
                  padding={2}
                  selected={paramsView === 'json'}
                  title={fitTitle}
                />
                <Tab
                  aria-controls="vision-request-params-content"
                  fontSize={1}
                  id="vision-params-view-form"
                  label={t('vision.params.view.form')}
                  onClick={() => setParamsView('form')}
                  onDoubleClick={fitParams}
                  padding={2}
                  selected={paramsView === 'form'}
                  title={fitTitle}
                />
              </TabList>
            </Flex>
            <Box id="vision-request-params-content">
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
        content: <LintTab findings={lintFindings} onReveal={onRevealRange} />,
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
    declaredFunctions,
    fitParams,
    functionCount,
    library,
    lintCount,
    lintFindings,
    onEditQuery,
    onOptionsChange,
    onParamsChange,
    onParamsFlush,
    onParamsReplace,
    onRevealRange,
    params,
    paramsEditorRef,
    paramsView,
    removeFunction,
    resolved,
    saveFunction,
    setParamsView,
    t,
    tab.options,
    tab.query,
    tab.rawParams,
  ])

  const runLabel = isFetching ? t('vision.query.stop') : t('action.query-execute')
  // Next to Stop live, the tooltip and accessible name say what Stop stops
  const runDescription = isFetching ? t('vision.query.stop.description') : runLabel

  return (
    <SplitWithBottomPanel
      defaultBottomSize={DEFAULT_BOTTOM_PANEL_SIZE}
      footer={
        <ActionRail testId="vision-query-actions">
          <ApiVersionButton onReveal={revealOption} resolved={resolved} />
          <RequestOverrideChips onReveal={revealOption} options={tab.options} resolved={resolved} />
          <Box flexBasis="0%" flexGrow={1} />
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
            onCopyQuery={onCopyQuery}
            onPrettify={onPrettify}
            request={request}
            resolved={resolved}
            tab={tab}
          />
        </ActionRail>
      }
      id="vision-request"
      onStateChange={setPanelState}
      ref={panelRef}
      state={panelState}
      tabs={panelTabs}
      testId="vision-request-column"
    >
      <Flex className={styles.querySection} ref={querySectionRef}>
        {generatorOpen && (
          <GenerateQueryBar
            client={resolved.client}
            formatForEditor={formatForEditor}
            onClose={closeGenerator}
            tab={tab}
          />
        )}
        <Box
          className={styles.editorContainer}
          data-testid="vision-query-editor"
          flexBasis="0%"
          flexGrow={1}
          minHeight="0"
          minWidth="0"
        >
          <Box className={styles.editorLabel}>
            <Flex alignItems="center" gap={2}>
              <Label muted size={1}>
                {t('query.label')}
              </Label>
              <Box flexBasis="0%" flexGrow={1} />
              <Flex alignItems="center" className={styles.labelActions} gap={1}>
                {!generatorOpen && (
                  <AgentActionsTooltip>
                    <GenerateQueryButton
                      className={styles.pressable}
                      onClick={() => setGeneratorOpen(true)}
                      text={t('vision.generate.button')}
                    />
                  </AgentActionsTooltip>
                )}
              </Flex>
            </Flex>
          </Box>
          <VisionCodeMirror
            extensions={queryExtensions}
            initialValue={tab.query}
            onChange={onQueryChange}
            ref={queryEditorRef}
          />
        </Box>
      </Flex>
    </SplitWithBottomPanel>
  )
}
