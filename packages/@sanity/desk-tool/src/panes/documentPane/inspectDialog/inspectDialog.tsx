/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */

import PropTypes from 'prop-types'
import React from 'react'
import {combineLatest, Observable} from 'rxjs'
import {map} from 'rxjs/operators'
import JSONInspector from 'react-json-inspector'
import FullScreenDialog from 'part:@sanity/components/dialogs/fullscreen'
import TabList from 'part:@sanity/components/tabs/tab-list'
import Tab from 'part:@sanity/components/tabs/tab'
import TabPanel from 'part:@sanity/components/tabs/tab-panel'
import {isObject} from 'lodash'
import HLRU from 'hashlru'
import {withPropsStream} from 'react-props-stream'
import settings from '../../../settings'
import DocTitle from '../../../components/DocTitle'

import styles from './inspectDialog.css'

const lru = HLRU(1000)

function isExpanded(keyPath: any, value: any) {
  const cached = lru.get(keyPath)
  if (cached === undefined) {
    lru.set(keyPath, Array.isArray(value) || isObject(value))
    return isExpanded(keyPath, value)
  }
  return cached
}

function toggleExpanded(event: any) {
  const {path} = event
  const current = lru.get(path)
  if (current === undefined) {
    // something is wrong
    return
  }
  lru.set(path, !current)
}

function selectElement(element: HTMLElement) {
  const sel = window.getSelection()

  if (sel) {
    const range = document.createRange()

    sel.removeAllRanges()
    range.selectNodeContents(element)
    sel.addRange(range)
  }
}

function select(event: any) {
  selectElement(event.currentTarget)
}

function maybeSelectAll(event: any) {
  const selectAll = event.keyCode === 65 && (event.metaKey || event.ctrlKey)
  if (!selectAll) {
    return
  }
  event.preventDefault()
  selectElement(event.currentTarget)
}

const VIEW_MODE_PARSED = {id: 'parsed', title: 'Parsed'}
const VIEW_MODE_RAW = {id: 'raw', title: 'JSON'}
const VIEW_MODES = [VIEW_MODE_PARSED, VIEW_MODE_RAW]

const viewModeSettings = settings.forKey('inspect-view-preferred-view-mode')

function mapReceivedPropsToChildProps(props$: Observable<any>) {
  const onViewModeChange = (nextViewMode: any) => viewModeSettings.set(nextViewMode.id)

  const viewModeSetting$ = viewModeSettings
    .listen('parsed')
    .pipe(map((id: any) => VIEW_MODES.find(mode => mode.id === id)))

  return combineLatest(props$, viewModeSetting$).pipe(
    map(([props, viewMode]) => ({...props, viewMode, onViewModeChange}))
  )
}

function InspectDialogComponent(props) {
  const {idPrefix, onClose, onViewModeChange, value, viewMode} = props

  // @todo: prefix with pane id
  const tabIdPrefix = `${idPrefix}_inspect_`

  return (
    <FullScreenDialog
      showHeader
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
              label="Parsed"
              // eslint-disable-next-line react/jsx-no-bind
              onClick={() => onViewModeChange(VIEW_MODE_PARSED)}
            />
            <Tab
              aria-controls={`${tabIdPrefix}tabpanel`}
              id={`${tabIdPrefix}tab-${VIEW_MODE_PARSED.id}`}
              isActive={viewMode === VIEW_MODE_RAW}
              label="Raw JSON"
              // eslint-disable-next-line react/jsx-no-bind
              onClick={() => onViewModeChange(VIEW_MODE_RAW)}
            />
          </TabList>
        </div>

        <TabPanel
          aria-labelledby={`${tabIdPrefix}tab-${viewMode.id}`}
          className={styles.content}
          id={`${tabIdPrefix}tabpanel`}
          role="tabpanel"
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

InspectDialogComponent.propTypes = {
  idPrefix: PropTypes.string.isRequired,
  onClose: PropTypes.func,
  onViewModeChange: PropTypes.func.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  value: PropTypes.object,
  viewMode: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired
  }).isRequired
}

InspectDialogComponent.defaultProps = {
  onClose: undefined,
  value: undefined
}

export const InspectDialog = withPropsStream(mapReceivedPropsToChildProps, InspectDialogComponent)
