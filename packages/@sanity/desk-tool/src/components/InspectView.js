import PropTypes from 'prop-types'
import React from 'react'
import './styles/JSONInspector.css'
import styles from './styles/InspectView.css'
import JSONInspector from 'react-json-inspector'
import DefaultDialog from 'part:@sanity/components/dialogs/default'
import ToggleButtons from 'part:@sanity/components/toggles/buttons'
import {isObject} from 'lodash'
import HLRU from 'hashlru'
import {getPublishedId} from 'part:@sanity/base/util/draft-utils'

const lru = HLRU(1000)

function isExpanded(keyPath, value) {
  const cached = lru.get(keyPath)
  if (cached === undefined) {
    lru.set(keyPath, Array.isArray(value) || isObject(value))
    return isExpanded(keyPath, value)
  }
  return cached
}

function toggleExpanded(event) {
  const {path} = event
  const current = lru.get(path)
  if (current === undefined) {
    // something is wrong
    return
  }
  lru.set(path, !current)
}

function selectElement(element) {
  const sel = window.getSelection()
  sel.removeAllRanges()
  const range = document.createRange()
  range.selectNodeContents(element)
  sel.addRange(range)
}

function select(event) {
  selectElement(event.currentTarget)
}

function maybeSelectAll(event) {
  const selectAll = event.keyCode === 65 && (event.metaKey || event.ctrlKey)
  if (!selectAll) {
    return
  }
  event.preventDefault()
  selectElement(event.currentTarget)
}

const VIEW_MODE_PARSED = {value: 'parsed', title: 'Parsed'}
const VIEW_MODE_RAW = {value: 'raw', title: 'Raw'}

const VIEW_MODES = [VIEW_MODE_PARSED, VIEW_MODE_RAW]

const VIEW_MODE_LS_KEY = 'desk-tool-inspect-view-preferred-view-mode'

function getPreferredViewMode() {
  const preferredViewMode = localStorage.getItem(VIEW_MODE_LS_KEY)
  return preferredViewMode && VIEW_MODES.find(mode => mode.value === preferredViewMode)
}

export default class InspectView extends React.PureComponent {
  state = {
    viewMode: getPreferredViewMode() || VIEW_MODE_PARSED
  }

  handleChangeViewMode = viewMode => {
    this.setState({viewMode: viewMode})
    localStorage.setItem(VIEW_MODE_LS_KEY, viewMode.value)
  }

  render() {
    const {value, onClose} = this.props
    const {viewMode} = this.state
    return (
      <DefaultDialog
        isOpen
        showHeader
        title={`Inspecting ${getPublishedId(value._id)}`}
        onClose={onClose}
      >
        <div className={styles.content}>
          <div className={styles.toolbar}>
            <ToggleButtons
              label="View"
              value={viewMode}
              items={VIEW_MODES}
              onChange={this.handleChangeViewMode}
            />
          </div>
          {viewMode === VIEW_MODE_PARSED && (
            <JSONInspector isExpanded={isExpanded} onClick={toggleExpanded} data={value} />
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
        </div>
      </DefaultDialog>
    )
  }
}

InspectView.propTypes = {
  value: PropTypes.object,
  onClose: PropTypes.func
}
