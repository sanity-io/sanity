import {SanityDocument} from '@sanity/types'
import {Card, Code, Dialog, Flex, Tab, TabList, TabPanel} from '@sanity/ui'
import React, {useCallback} from 'react'
import JSONInspector from 'react-json-inspector'
import {withPropsStream} from 'react-props-stream'
import {combineLatest, Observable} from 'rxjs'
import {map} from 'rxjs/operators'
import {DocTitle} from '../../../components/DocTitle'
import {deskToolSettings} from '../../../settings'
import {useDocumentPane} from '../useDocumentPane'
import {VIEW_MODE_PARSED, VIEW_MODE_RAW, VIEW_MODES} from './constants'
import {isDocumentWithType, isExpanded, maybeSelectAll, select, toggleExpanded} from './helpers'
import {JSONInspectorWrapper} from './InspectDialog.styles'
import {Search} from './Search'
import {InspectViewMode} from './types'

interface InspectDialogProps {
  value: Partial<SanityDocument> | null
}

interface InnerInspectDialogProps extends InspectDialogProps {
  onViewModeChange: (viewMode: InspectViewMode) => void
  viewMode: InspectViewMode
}

const viewModeSettings = deskToolSettings.forKey('inspect-view-preferred-view-mode')

function mapReceivedPropsToChildProps(
  props$: Observable<InspectDialogProps>
): Observable<InnerInspectDialogProps> {
  const onViewModeChange = (nextViewMode: InspectViewMode) => viewModeSettings.set(nextViewMode.id)

  const viewModeSetting$: Observable<InspectViewMode> = viewModeSettings
    .listen('parsed')
    .pipe(map((id: string) => VIEW_MODES.find((mode) => mode.id === id)))

  return combineLatest(props$, viewModeSetting$).pipe(
    map(([props, viewMode]) => ({...props, viewMode, onViewModeChange}))
  )
}

function InspectDialogComponent(props: InnerInspectDialogProps) {
  const {onViewModeChange, value, viewMode} = props
  const {handleInspectClose, paneKey} = useDocumentPane()
  const dialogIdPrefix = `${paneKey}_inspect_`

  const setParsedViewMode = useCallback(() => {
    onViewModeChange(VIEW_MODE_PARSED)
  }, [onViewModeChange])

  const setRawViewMode = useCallback(() => {
    onViewModeChange(VIEW_MODE_RAW)
  }, [onViewModeChange])

  return (
    <Dialog
      id={`${dialogIdPrefix}dialog`}
      header={
        isDocumentWithType(value) ? (
          <>
            Inspecting{' '}
            <em>
              <DocTitle document={value} />
            </em>
          </>
        ) : (
          <em>No value</em>
        )
      }
      onClose={handleInspectClose}
      width={3}
    >
      <Flex direction="column" height="fill">
        <Card padding={3} shadow={1} style={{position: 'sticky', bottom: 0, zIndex: 3}}>
          <TabList space={1}>
            <Tab
              aria-controls={`${dialogIdPrefix}tabpanel`}
              fontSize={1}
              id={`${dialogIdPrefix}tab-${VIEW_MODE_PARSED.id}`}
              label={VIEW_MODE_PARSED.title}
              onClick={setParsedViewMode}
              selected={viewMode === VIEW_MODE_PARSED}
            />
            <Tab
              aria-controls={`${dialogIdPrefix}tabpanel`}
              fontSize={1}
              id={`${dialogIdPrefix}tab-${VIEW_MODE_RAW.id}`}
              label={VIEW_MODE_RAW.title}
              onClick={setRawViewMode}
              selected={viewMode === VIEW_MODE_RAW}
            />
          </TabList>
        </Card>

        <TabPanel
          aria-labelledby={`${dialogIdPrefix}tab-${viewMode.id}`}
          flex={1}
          id={`${dialogIdPrefix}tabpanel`}
          overflow="auto"
          padding={4}
          style={{outline: 'none'}}
        >
          {viewMode === VIEW_MODE_PARSED && (
            <JSONInspectorWrapper>
              <JSONInspector
                data={value}
                isExpanded={isExpanded}
                onClick={toggleExpanded}
                search={Search}
              />
            </JSONInspectorWrapper>
          )}

          {viewMode === VIEW_MODE_RAW && (
            <Code
              language="json"
              tabIndex={0}
              onKeyDown={maybeSelectAll}
              onDoubleClick={select}
              onFocus={select}
            >
              {JSON.stringify(value, null, 2)}
            </Code>
          )}
        </TabPanel>
      </Flex>
    </Dialog>
  )
}

export const InspectDialog = withPropsStream<InspectDialogProps, InnerInspectDialogProps>(
  mapReceivedPropsToChildProps,
  InspectDialogComponent
)
