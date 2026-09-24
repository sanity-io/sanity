import {SplitPane} from '@rexxars/react-split-pane'
import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {PlayIcon} from '@sanity/icons/Play'
import {StopIcon} from '@sanity/icons/Stop'
import {Button, Hotkeys, Label, Text} from '@sanity/ui'
import {Tooltip} from '@sanity/ui/tooltip'
import {type RefObject, useMemo, useState} from 'react'
import {useTranslation} from 'sanity'
import {Box, Flex} from 'ui5'

import {groqExtensions} from '../../../codemirror/extensions'
import {VisionCodeMirror, type VisionCodeMirrorHandle} from '../../../codemirror/VisionCodeMirror'
import {type Params} from '../../../components/VisionGui'
import {visionLocaleNamespace} from '../../../i18n'
import {type ResolvedRequest} from '../../hooks/useResolvedRequest'
import {type QueryRequest, type VistaTab, type VistaTabOptions} from '../../store/types'
import {useVistaExperience} from '../../store/VistaActorContext'
import {getVistaShortcuts} from '../../util/shortcuts'
import {ActionRail} from '../ActionRail'
import {CollapsiblePanel, PANEL_HEADER_HEIGHT} from '../CollapsiblePanel'
import {editorContainer, editorLabel, paneFill, splitPaneContainer} from '../vista.css'
import {OptionsTab} from './OptionsTab'
import {ParamsTab} from './ParamsTab'
import {QueryActionsMenu} from './QueryActionsMenu'

const DEFAULT_BOTTOM_PANEL_SIZE = {columns: 260, stacked: 200, mobile: 180}

export interface RequestPanelProps {
  tab: VistaTab
  params: Params
  request: QueryRequest | null
  resolved: ResolvedRequest
  isFetching: boolean
  datasets: string[]
  projectId: string
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
}

export function RequestPanel(props: RequestPanelProps) {
  const {
    tab,
    params,
    request,
    resolved,
    isFetching,
    datasets,
    projectId,
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
  } = props
  const {t} = useTranslation(visionLocaleNamespace)
  const [activePanelTab, setActivePanelTab] = useState('params')
  const [collapsed, setCollapsed] = useState(false)
  const {layout} = useVistaExperience()
  const [bottomSize, setBottomSize] = useState(() => DEFAULT_BOTTOM_PANEL_SIZE[layout])
  const fetchShortcut = useMemo(
    () => getVistaShortcuts().find((shortcut) => shortcut.id === 'fetch'),
    [],
  )

  const panelTabs = useMemo(
    () => [
      {
        id: 'params',
        label: t('params.label'),
        icon: params.valid ? undefined : (
          <Text size={1}>
            <ErrorOutlineIcon />
          </Text>
        ),
        content: (
          <ParamsTab
            editorRef={paramsEditorRef}
            onChange={onParamsChange}
            params={params}
            value={tab.rawParams}
          />
        ),
      },
      {
        id: 'options',
        label: t('vista.panel.options'),
        content: (
          <OptionsTab
            datasets={datasets}
            onChange={onOptionsChange}
            options={tab.options}
            resolved={resolved}
          />
        ),
      },
    ],
    [
      datasets,
      onOptionsChange,
      onParamsChange,
      params,
      paramsEditorRef,
      resolved,
      t,
      tab.options,
      tab.rawParams,
    ],
  )

  return (
    <Flex data-testid="vista-request-panel" flexDirection="column" height="100%">
      <Box className={splitPaneContainer}>
        <SplitPane
          allowResize={!collapsed}
          maxSize={-120}
          minSize={PANEL_HEADER_HEIGHT}
          onChange={(size: number) => setBottomSize(size)}
          primary="second"
          size={collapsed ? PANEL_HEADER_HEIGHT : bottomSize}
          split="horizontal"
        >
          <Flex className={paneFill}>
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
                extensions={groqExtensions}
                initialValue={tab.query}
                onChange={onQueryChange}
                ref={queryEditorRef}
              />
            </Box>
            <ActionRail testId="vista-query-actions">
              <Tooltip
                content={
                  <Flex alignItems="center" gap={2} padding={1}>
                    <Text size={1}>
                      {isFetching ? t('vista.query.stop') : t('action.query-execute')}
                    </Text>
                    {!isFetching && fetchShortcut && (
                      <Hotkeys fontSize={0} keys={fetchShortcut.keys} />
                    )}
                  </Flex>
                }
                placement="left"
                portal
              >
                <Button
                  aria-label={isFetching ? t('vista.query.stop') : t('action.query-execute')}
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
                datasets={datasets}
                onCopyQuery={onCopyQuery}
                onPrettify={onPrettify}
                onToggleAutoRefetch={onToggleAutoRefetch}
                projectId={projectId}
                request={request}
                resolved={resolved}
                tab={tab}
              />
            </ActionRail>
          </Flex>
          <Box className={paneFill}>
            <CollapsiblePanel
              activeTabId={activePanelTab}
              collapsed={collapsed}
              id="vista-request"
              onTabChange={setActivePanelTab}
              onToggle={() => setCollapsed((current) => !current)}
              tabs={panelTabs}
            />
          </Box>
        </SplitPane>
      </Box>
    </Flex>
  )
}
