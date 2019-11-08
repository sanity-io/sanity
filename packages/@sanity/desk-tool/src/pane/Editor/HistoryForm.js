import React from 'react'
import PropTypes from 'prop-types'
import {format, isToday, isYesterday} from 'date-fns'
import FormBuilder from 'part:@sanity/form-builder'
import Spinner from 'part:@sanity/components/loading/spinner'
import TimeAgo from '../../components/TimeAgo'
import Delay from '../../utils/Delay'
import styles from '../styles/Editor.css'

const noop = () => null
const noopPatchChannel = {onPatch: () => noop, receivePatches: noop}

const dateFormat = 'MMM D, YYYY, hh:mm A'

export function getDateString(date) {
  if (isToday(date)) {
    return `Today, ${format(date, 'hh:mm A')}`
  }
  if (isYesterday(date)) {
    return `Yesterday, ${format(date, 'hh:mm A')}`
  }
  return format(date, dateFormat)
}

export default class HistoryForm extends React.PureComponent {
  static propTypes = {
    schema: PropTypes.object.isRequired,
    type: PropTypes.object.isRequired,
    isLatest: PropTypes.bool.isRequired,
    event: PropTypes.shape({
      displayDocumentId: PropTypes.string,
      rev: PropTypes.string,
      endTime: PropTypes.string
    }),
    document: PropTypes.shape({
      isLoading: PropTypes.bool.isRequired,
      snapshot: PropTypes.shape({_type: PropTypes.string})
    }).isRequired
  }

  static defaultProps = {
    event: undefined
  }

  // Prevent re-rendering flicker when transitioning between snapshots
  static getDerivedStateFromProps(newProps, currentState) {
    return {prevSnapshot: newProps.document.snapshot || currentState.prevSnapshot}
  }

  state = {
    focusPath: []
  }

  handleFocus = focusPath => {
    this.setState({focusPath})
  }

  render() {
    const {schema, type, event, isLatest, document} = this.props
    const {snapshot, isLoading: isLoadingSnapshot} = document
    const {focusPath, prevSnapshot} = this.state
    const usedSnapshot = snapshot || prevSnapshot
    const isLoading = isLoadingSnapshot

    if (!isLoadingSnapshot && !event) {
      return (
        <Delay ms={600}>
          <div className={styles.spinnerContainer}>
            <Spinner center message="Loading revision" />
          </div>
        </Delay>
      )
    }

    return (
      <>
        {isLoading && (
          <Delay ms={600}>
            <div className={styles.spinnerContainer}>
              <Spinner center message={`Loading revision from ${getDateString(event.endTime)}…`} />
            </div>
          </Delay>
        )}
        <div className={styles.top}>
          {usedSnapshot && (
            <span className={styles.editedTime}>
              {'Changed '}
              <TimeAgo time={event.endTime} />
              {isLatest && <span> - Latest version</span>}
            </span>
          )}
        </div>

        <form className={styles.editor} id="Sanity_Default_DeskTool_Editor_ScrollContainer">
          {!isLoading && !usedSnapshot && (
            <p>There is no data associated with this history event.</p>
          )}
          {usedSnapshot && (
            <FormBuilder
              onBlur={noop}
              onFocus={this.handleFocus}
              focusPath={focusPath}
              readOnly
              schema={schema}
              type={type}
              value={usedSnapshot}
              patchChannel={noopPatchChannel}
            />
          )}
        </form>
      </>
    )
  }
}
