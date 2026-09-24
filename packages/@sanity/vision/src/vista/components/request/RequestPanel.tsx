import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {PlayIcon} from '@sanity/icons/Play'
import {StopIcon} from '@sanity/icons/Stop'
import {Button, Hotkeys, Label, Text} from '@sanity/ui'
import {Tooltip} from '@sanity/ui/tooltip'
import {type RefObject, useMemo} from 'react'
import {useTranslation} from 'sanity'
import {Box, Flex} from 'ui5'

import {groqExtensions} from '../../../codemirror/extensions'
import {VisionCodeMirror, type VisionCodeMirrorHandle} from '../../../codemirror/VisionCodeMirror'
import {type Params} from '../../../components/VisionGui'
import {visionLocaleNamespace} from '../../../i18n'
import {type ResolvedRequest} from '../../hooks/useResolvedRequest'
import {type QueryRequest, type VistaTab, type VistaTabOptions} from '../../store/types'
import {VISTA_SHORTCUTS} from '../../util/shortcuts'
import {ActionRail} from '../ActionRail'
import {type CollapsiblePanelTab} from '../CollapsiblePanel'
import {SplitWithBottomPanel} from '../SplitWithBottomPanel'
import {editorContainer, editorLabel} from '../vista.css'
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

  const panelTabs = useMemo(
    (): CollapsiblePanelTab[] => [
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
          <OptionsTab onChange={onOptionsChange} options={tab.options} resolved={resolved} />
        ),
      },
    ],
    [
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

  const runLabel = isFetching ? t('vista.query.stop') : t('action.query-execute')

  return (
    <SplitWithBottomPanel
      defaultBottomSize={DEFAULT_BOTTOM_PANEL_SIZE}
      id="vista-request"
      tabs={panelTabs}
      testId="vista-request-panel"
    >
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
    </SplitWithBottomPanel>
  )
}
