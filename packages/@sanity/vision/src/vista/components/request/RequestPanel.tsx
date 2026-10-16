import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {PlayIcon} from '@sanity/icons/Play'
import {SparklesIcon} from '@sanity/icons/Sparkles'
import {StopIcon} from '@sanity/icons/Stop'
import {Button, Hotkeys, Label, Tab, TabList, Text} from '@sanity/ui'
import {Tooltip} from '@sanity/ui/tooltip'
import {type RefObject, useCallback, useMemo, useRef, useState} from 'react'
import {type Schema, useSchema, useTranslation} from 'sanity'
import {Box, Flex} from 'ui5'

import {groqExtensions} from '../../../codemirror/extensions'
import {VisionCodeMirror, type VisionCodeMirrorHandle} from '../../../codemirror/VisionCodeMirror'
import {type Params} from '../../../components/VisionGui'
import {visionLocaleNamespace} from '../../../i18n'
import {type QueryRequestBuilder} from '../../hooks/useQueryRequestBuilder'
import {type ResolvedRequest} from '../../hooks/useResolvedRequest'
import {
  type QueryRequest,
  type VistaPanel,
  type VistaParamsView,
  type VistaTab,
  type VistaTabOptions,
} from '../../store/types'
import {useVistaActor, useVistaSelector} from '../../store/VistaActorContext'
import {isPanelExpanded, selectFunctionLibrary, selectParamsView} from '../../store/vistaMachine'
import {cx} from '../../util/cx'
import {functionLibrary, querySchema} from '../../util/groqEditorContext'
import {createGroqFunctionExtensions} from '../../util/groqFunctionEditor'
import {createGroqLintExtensions, type QueryLintFinding} from '../../util/groqLint'
import {createQuerySchema} from '../../util/schemaCheck'
import {VISTA_SHORTCUTS} from '../../util/shortcuts'
import {ActionRail} from '../ActionRail'
import {AgentActionsTooltip} from '../AgentActionsTooltip'
import {CollapsibleSection} from '../CollapsibleSection'
import {
  editorContainer,
  editorLabel,
  labelActions,
  optionsSection,
  paramsSection,
  paramsSectionResized,
  querySection,
  sectionResizer,
} from '../vista.css'
import {ApiVersionButton, type RevealedOption} from './ApiVersionButton'
import {GenerateQueryBar} from './GenerateQueryBar'
import {LiveButton} from './LiveButton'
import {OptionsPanel} from './OptionsPanel'
import {ParamsForm} from './ParamsForm'
import {ParamsPanel} from './ParamsPanel'
import {QueryActionsMenu} from './QueryActionsMenu'
import {SECTION_MIN_HEIGHT, useDragResize} from './useDragResize'

export interface RequestPanelProps {
  tab: VistaTab
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
  onOptionsChange: (options: Partial<VistaTabOptions>) => void
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
}

/**
 * The request column: the query editor over the params and options panels. The editor takes
 * whatever the panels leave over; params grow with their JSON (drag their top edge to override,
 * double-click it to fit again) and the options are as tall as the fields.
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
    onOptionsChange,
    onRun,
    onCancel,
    onPrettify,
    formatForEditor,
    onCopyQuery,
    onToggleAutoRefetch,
    onLintFindings,
  } = props
  const {t} = useTranslation(visionLocaleNamespace)
  // The GROQ editor setup, the diagnostics reporting to the Lint panel, and the documentation,
  // completions and extraction of functions, which know the library. Only the library's facet
  // changes when a function is saved; the rest of the setup stays as it is
  const lintExtensions = useMemo(() => createGroqLintExtensions(onLintFindings), [onLintFindings])
  const functionExtensions = useMemo(
    () =>
      createGroqFunctionExtensions({
        reference: t('vista.functions.editor.reference'),
        apiVersion: (version) => t('vista.functions.editor.api-version', {version}),
        deltaOnly: t('vista.functions.editor.delta-only'),
        declaredOn: (line) => t('vista.functions.editor.declared-on', {line}),
        inLibrary: t('vista.functions.editor.in-library'),
        completionDeclared: t('vista.functions.editor.completion-declared'),
        completionLibrary: t('vista.functions.editor.completion-library'),
        extract: t('vista.functions.editor.extract'),
        addFromLibrary: t('vista.functions.editor.add-from-library'),
        useSuggestion: (suggestion) => t('vista.lint.use-suggestion', {suggestion}),
      }),
    [t],
  )
  const library = useVistaSelector(selectFunctionLibrary)
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
  const actorRef = useVistaActor()
  const paramsExpanded = useVistaSelector((snapshot) => isPanelExpanded(snapshot, 'params'))
  const optionsExpanded = useVistaSelector((snapshot) => isPanelExpanded(snapshot, 'options'))
  const togglePanel = useCallback(
    (panel: VistaPanel) => actorRef.send({type: 'panel.toggle', panel}),
    [actorRef],
  )
  const paramsView = useVistaSelector(selectParamsView)
  const setParamsView = useCallback(
    (view: VistaParamsView) => actorRef.send({type: 'params.view', view}),
    [actorRef],
  )

  const containerRef = useRef<HTMLDivElement>(null)
  const paramsRef = useRef<HTMLElement>(null)
  const optionsRef = useRef<HTMLElement>(null)
  const paramsResize = useDragResize({containerRef, sectionRef: paramsRef, siblingRef: optionsRef})
  const paramsHeightNow = paramsResize.height ?? paramsResize.measured?.current

  const [generatorOpen, setGeneratorOpen] = useState(false)
  // Closing hands the keyboard back to the query editor, where the bar was opened from
  const closeGenerator = useCallback(() => {
    setGeneratorOpen(false)
    requestAnimationFrame(() =>
      containerRef.current
        ?.querySelector<HTMLElement>('[data-testid="vista-query-editor"] .cm-content')
        ?.focus(),
    )
  }, [])

  // The API version button shows the field that changes what it says: the Options panel opens if
  // it was collapsed, and once its fields have mounted the API version field (or, while a variant
  // locks it, the wrapper that stands in for it) takes focus, or the perspective while that keeps
  // the queries off the API CDN
  const revealOption = useCallback(
    (option: RevealedOption) => {
      if (!optionsExpanded) togglePanel('options')
      requestAnimationFrame(() => {
        const options = optionsRef.current
        const field =
          option === 'perspective'
            ? options?.querySelector<HTMLElement>('#vista-option-perspective')
            : (options?.querySelector<HTMLElement>(
                'input[data-testid="vista-option-api-version-custom"], [data-testid="vista-option-api-version-custom"] input',
              ) ??
              options?.querySelector<HTMLElement>(
                '[data-testid="vista-option-api-version-wrap"][tabindex]',
              ) ??
              options?.querySelector<HTMLElement>('#vista-option-api-version'))
        field?.focus()
      })
    },
    [optionsExpanded, togglePanel],
  )

  const runLabel = isFetching ? t('vista.query.stop') : t('action.query-execute')
  // Next to Stop live, the tooltip and accessible name say what Stop stops
  const runDescription = isFetching ? t('vista.query.stop.description') : runLabel

  return (
    <Flex data-testid="vista-request-panel" flexDirection="column" height="100%">
      <Flex flexBasis="0%" flexDirection="column" flexGrow={1} minHeight="0" ref={containerRef}>
        <Flex className={querySection}>
          {generatorOpen && (
            <GenerateQueryBar
              client={resolved.client}
              formatForEditor={formatForEditor}
              onClose={closeGenerator}
              tab={tab}
            />
          )}
          <Box
            className={editorContainer}
            data-testid="vista-query-editor"
            flexBasis="0%"
            flexGrow={1}
            minHeight="0"
            minWidth="0"
          >
            <Box className={editorLabel}>
              <Flex alignItems="center" gap={2}>
                <Label muted size={1}>
                  {t('query.label')}
                </Label>
                <Box flexBasis="0%" flexGrow={1} />
                <Flex alignItems="center" className={labelActions} gap={1}>
                  {!generatorOpen && (
                    <AgentActionsTooltip title={t('vista.generate.button')}>
                      <Button
                        aria-label={t('vista.generate.button')}
                        data-testid="vista-generate-query"
                        fontSize={1}
                        icon={SparklesIcon}
                        mode="bleed"
                        onClick={() => setGeneratorOpen(true)}
                        padding={2}
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
        <CollapsibleSection
          className={cx(paramsSection, paramsResize.height !== null && paramsSectionResized)}
          expanded={paramsExpanded}
          handle={
            paramsExpanded && (
              // The focusable separator widget: drag or arrow keys resize, Enter resets
              <div
                aria-label={t('vista.params.resize')}
                aria-orientation="horizontal"
                aria-valuemax={paramsResize.measured?.max}
                aria-valuemin={SECTION_MIN_HEIGHT}
                aria-valuenow={paramsHeightNow}
                aria-valuetext={
                  paramsResize.height === null && paramsHeightNow !== undefined
                    ? t('vista.params.fit-height', {height: paramsHeightNow})
                    : undefined
                }
                className={sectionResizer}
                data-dragging={paramsResize.dragging}
                data-testid="vista-request-params-resizer"
                onDoubleClick={paramsResize.reset}
                onFocus={paramsResize.onFocus}
                onKeyDown={paramsResize.onKeyDown}
                onPointerDown={paramsResize.onPointerDown}
                role="separator"
                tabIndex={0}
                title={t('vista.params.resize')}
              />
            )
          }
          icon={
            params.valid ? undefined : (
              <Text size={1}>
                <ErrorOutlineIcon />
              </Text>
            )
          }
          actions={
            <TabList aria-label={t('vista.params.view.label')} gap={1}>
              <Tab
                aria-controls="vista-request-params-content"
                fontSize={1}
                id="vista-params-view-json"
                label={t('vista.params.view.json')}
                onClick={() => setParamsView('json')}
                padding={2}
                selected={paramsView === 'json'}
              />
              <Tab
                aria-controls="vista-request-params-content"
                fontSize={1}
                id="vista-params-view-form"
                label={t('vista.params.view.form')}
                onClick={() => setParamsView('form')}
                padding={2}
                selected={paramsView === 'form'}
              />
            </TabList>
          }
          id="vista-request-params"
          onToggle={() => togglePanel('params')}
          ref={paramsRef}
          style={paramsResize.height === null ? undefined : {height: paramsResize.height}}
          title={t('params.label')}
        >
          {paramsView === 'form' ? (
            <ParamsForm onChange={onParamsReplace} params={params} query={tab.query} />
          ) : (
            <ParamsPanel
              editorRef={paramsEditorRef}
              onChange={onParamsChange}
              params={params}
              value={tab.rawParams}
            />
          )}
        </CollapsibleSection>
        <CollapsibleSection
          className={optionsSection}
          expanded={optionsExpanded}
          id="vista-request-options"
          onToggle={() => togglePanel('options')}
          ref={optionsRef}
          title={t('vista.panel.options')}
        >
          <OptionsPanel onChange={onOptionsChange} options={tab.options} resolved={resolved} />
        </CollapsibleSection>
      </Flex>
      <ActionRail testId="vista-query-actions">
        <ApiVersionButton onReveal={revealOption} resolved={resolved} />
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
              <Text size={1}>{runDescription}</Text>
              {!isFetching && <Hotkeys fontSize={0} keys={VISTA_SHORTCUTS.fetch.keys} />}
            </Flex>
          }
          placement="top"
          portal
        >
          <Button
            aria-label={runDescription}
            data-testid="vista-fetch-button"
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
    </Flex>
  )
}
