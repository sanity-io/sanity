import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {PlayIcon} from '@sanity/icons/Play'
import {StopIcon} from '@sanity/icons/Stop'
import {Button, Hotkeys, Label, Text} from '@sanity/ui'
import {Tooltip} from '@sanity/ui/tooltip'
import {type RefObject, useCallback, useMemo, useRef} from 'react'
import {useTranslation} from 'sanity'
import {Box, Flex} from 'ui5'

import {groqExtensions} from '../../../codemirror/extensions'
import {VisionCodeMirror, type VisionCodeMirrorHandle} from '../../../codemirror/VisionCodeMirror'
import {type Params} from '../../../components/VisionGui'
import {visionLocaleNamespace} from '../../../i18n'
import {type ResolvedRequest} from '../../hooks/useResolvedRequest'
import {
  type QueryRequest,
  type VistaPanel,
  type VistaTab,
  type VistaTabOptions,
} from '../../store/types'
import {useVistaActor, useVistaSelector} from '../../store/VistaActorContext'
import {isPanelExpanded} from '../../store/vistaMachine'
import {cx} from '../../util/cx'
import {createGroqLintExtensions, type QueryLintFinding} from '../../util/groqLint'
import {VISTA_SHORTCUTS} from '../../util/shortcuts'
import {ActionRail} from '../ActionRail'
import {CollapsibleSection} from '../CollapsibleSection'
import {
  editorContainer,
  editorLabel,
  optionsSection,
  paramsSection,
  paramsSectionResized,
  querySection,
  sectionResizer,
} from '../vista.css'
import {OptionsPanel} from './OptionsPanel'
import {ParamsPanel} from './ParamsPanel'
import {QueryActionsMenu} from './QueryActionsMenu'
import {SECTION_MIN_HEIGHT, useDragResize} from './useDragResize'

export interface RequestPanelProps {
  tab: VistaTab
  params: Params
  request: QueryRequest | null
  resolved: ResolvedRequest
  isFetching: boolean
  queryEditorRef: RefObject<VisionCodeMirrorHandle | null>
  paramsEditorRef: RefObject<VisionCodeMirrorHandle | null>
  onQueryChange: (query: string) => void
  onParamsChange: (rawParams: string) => void
  onOptionsChange: (options: Partial<VistaTabOptions>) => void
  onRun: () => void
  onCancel: () => void
  onPrettify: () => void
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
    resolved,
    isFetching,
    queryEditorRef,
    paramsEditorRef,
    onQueryChange,
    onParamsChange,
    onOptionsChange,
    onRun,
    onCancel,
    onPrettify,
    onCopyQuery,
    onToggleAutoRefetch,
    onLintFindings,
  } = props
  const {t} = useTranslation(visionLocaleNamespace)
  // The GROQ editor setup plus the `groq-lint` diagnostics, reporting to the Lint panel
  const queryExtensions = useMemo(
    () => [...groqExtensions, ...createGroqLintExtensions(onLintFindings)],
    [onLintFindings],
  )
  const actorRef = useVistaActor()
  const paramsExpanded = useVistaSelector((snapshot) => isPanelExpanded(snapshot, 'params'))
  const optionsExpanded = useVistaSelector((snapshot) => isPanelExpanded(snapshot, 'options'))
  const togglePanel = useCallback(
    (panel: VistaPanel) => actorRef.send({type: 'panel.toggle', panel}),
    [actorRef],
  )

  const containerRef = useRef<HTMLDivElement>(null)
  const paramsRef = useRef<HTMLElement>(null)
  const optionsRef = useRef<HTMLElement>(null)
  const paramsResize = useDragResize({containerRef, sectionRef: paramsRef, siblingRef: optionsRef})
  const paramsHeightNow = paramsResize.height ?? paramsResize.measured?.current

  const runLabel = isFetching ? t('vista.query.stop') : t('action.query-execute')

  return (
    <Flex data-testid="vista-request-panel" flexDirection="column" height="100%" ref={containerRef}>
      <Flex className={querySection}>
        <Box
          className={editorContainer}
          data-testid="vista-query-editor"
          flexBasis="0%"
          flexGrow={1}
          minWidth="0"
        >
          <Box className={editorLabel}>
            <Label muted size={1}>
              {t('query.label')}
            </Label>
          </Box>
          <VisionCodeMirror
            extensions={queryExtensions}
            initialValue={tab.query}
            onChange={onQueryChange}
            ref={queryEditorRef}
          />
        </Box>
        <ActionRail testId="vista-query-actions">
          <Tooltip
            content={
              <Flex alignItems="center" gap={2} padding={1}>
                <Text size={1}>{runLabel}</Text>
                {!isFetching && <Hotkeys fontSize={0} keys={VISTA_SHORTCUTS.fetch.keys} />}
              </Flex>
            }
            placement="left"
            portal
          >
            <Button
              aria-label={runLabel}
              data-testid="vista-fetch-button"
              disabled={!isFetching && !request}
              icon={isFetching ? StopIcon : PlayIcon}
              mode="default"
              onClick={isFetching ? onCancel : onRun}
              padding={2}
              tone={isFetching ? 'critical' : 'primary'}
            />
          </Tooltip>
          <QueryActionsMenu
            onCopyQuery={onCopyQuery}
            onPrettify={onPrettify}
            onToggleAutoRefetch={onToggleAutoRefetch}
            request={request}
            resolved={resolved}
            tab={tab}
          />
        </ActionRail>
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
        id="vista-request-params"
        onToggle={() => togglePanel('params')}
        ref={paramsRef}
        style={paramsResize.height === null ? undefined : {height: paramsResize.height}}
        title={t('params.label')}
      >
        <ParamsPanel
          editorRef={paramsEditorRef}
          onChange={onParamsChange}
          params={params}
          value={tab.rawParams}
        />
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
  )
}
