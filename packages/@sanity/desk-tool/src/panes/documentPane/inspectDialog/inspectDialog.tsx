import {SanityDocument} from '@sanity/types'
import FullScreenDialog from 'part:@sanity/components/dialogs/fullscreen'
import Tab from 'part:@sanity/components/tabs/tab'
import TabList from 'part:@sanity/components/tabs/tab-list'
import TabPanel from 'part:@sanity/components/tabs/tab-panel'
import React, {useCallback} from 'react'
import JSONInspector from 'react-json-inspector'
import {withPropsStream} from 'react-props-stream'
import {combineLatest, Observable} from 'rxjs'
import {map} from 'rxjs/operators'
import DocTitle from '../../../components/DocTitle'
import settings from '../../../settings'
import {VIEW_MODE_PARSED, VIEW_MODE_RAW, VIEW_MODES} from './constants'
import {isExpanded, maybeSelectAll, select, toggleExpanded} from './helpers'
import {InspectViewMode} from './types'

import styles from './inspectDialog.css'

interface InspectDialogProps {
  idPrefix: string
  onClose: () => void
  value: SanityDocument | null
}

interface InnerInspectDialogProps extends InspectDialogProps {
  onViewModeChange: (viewMode: InspectViewMode) => void
  viewMode: InspectViewMode
}

const viewModeSettings = settings.forKey('inspect-view-preferred-view-mode')

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
  const {idPrefix, onClose, onViewModeChange, value, viewMode} = props
  const tabIdPrefix = `${idPrefix}_inspect_`

  const setParsedViewMode = useCallback(() => {
    onViewModeChange(VIEW_MODE_PARSED)
  }, [onViewModeChange])

  const setRawViewMode = useCallback(() => {
    onViewModeChange(VIEW_MODE_RAW)
  }, [onViewModeChange])

  return (
    <FullScreenDialog
      title={
        <span>
          Inspecting{' '}
          <em>
            <DocTitle document={value} />
          </em>
        </span>
      }
      onClose={onClose}
    >
      <div>
        <div className={styles.toolbar}>
          <TabList>
            <Tab
              aria-controls={`${tabIdPrefix}tabpanel`}
              id={`${tabIdPrefix}tab-${VIEW_MODE_PARSED.id}`}
              isActive={viewMode === VIEW_MODE_PARSED}
              label={VIEW_MODE_PARSED.title}
              onClick={setParsedViewMode}
            />
            <Tab
              aria-controls={`${tabIdPrefix}tabpanel`}
              id={`${tabIdPrefix}tab-${VIEW_MODE_RAW.id}`}
              isActive={viewMode === VIEW_MODE_RAW}
              label={VIEW_MODE_RAW.title}
              onClick={setRawViewMode}
            />
          </TabList>
        </div>

        <TabPanel
          aria-labelledby={`${tabIdPrefix}tab-${viewMode.id}`}
          className={styles.content}
          id={`${tabIdPrefix}tabpanel`}
        >
          {viewMode === VIEW_MODE_PARSED && (
            <div className={styles.jsonInspectorContainer}>
              <JSONInspector isExpanded={isExpanded} onClick={toggleExpanded} data={value} />
            </div>
          )}
          {viewMode === VIEW_MODE_RAW && (
            <pre
              className={styles.raw}
              tabIndex={0}
              onKeyDown={maybeSelectAll}
              onDoubleClick={select}
              onFocus={select}
            >
              {JSON.stringify(value, null, 2)}
            </pre>
          )}
        </TabPanel>
      </div>
    </FullScreenDialog>
  )
}

export const InspectDialog = withPropsStream<InspectDialogProps, InnerInspectDialogProps>(
  mapReceivedPropsToChildProps,
  InspectDialogComponent
)
