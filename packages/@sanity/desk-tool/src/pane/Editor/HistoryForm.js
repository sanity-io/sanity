import React from 'react'
import PropTypes from 'prop-types'
import FormBuilder from 'part:@sanity/form-builder'
import historyStore from 'part:@sanity/base/datastore/history'
import TimeAgo from '../../components/TimeAgo'
import styles from '../styles/Editor.css'
import {format, isToday, isYesterday} from 'date-fns'

import Spinner from 'part:@sanity/components/loading/spinner'
import Delay from '../../utils/Delay'

const noop = () => null

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
    event: PropTypes.shape({
      displayDocumentId: PropTypes.string,
      rev: PropTypes.string,
      endTime: PropTypes.string
    }),
    isLatest: PropTypes.bool
  }
  state = {
    isLoading: true,
    document: null,
    focusPath: []
  }

  componentDidMount() {
    const {displayDocumentId, rev} = this.props.event
    this.fetch(displayDocumentId, rev)
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.event !== this.props.event) {
      const {displayDocumentId, rev} = nextProps.event
      this.fetch(displayDocumentId, rev)
    }
  }

  fetch(id, rev) {
    this.setState({isLoading: true})
    historyStore.getDocumentAtRevision(id, rev).then(res => {
      this.setState({document: res, isLoading: false})
    })
  }

  handleFocus = focusPath => {
    this.setState({focusPath})
  }

  render() {
    const {schema, type, event, isLatest} = this.props
    const {isLoading, document, focusPath} = this.state
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
          {document && (
            <span className={styles.editedTime}>
              {'Changed '}
              <TimeAgo time={event.endTime} />
              {isLatest && <span> - Latest version</span>}
            </span>
          )}
        </div>

        <form className={styles.editor} id="Sanity_Default_DeskTool_Editor_ScrollContainer">
          {!isLoading && !document && <p>There is no data associated with this history event.</p>}
          {document && (
            <FormBuilder
              onBlur={noop}
              onFocus={this.handleFocus}
              focusPath={focusPath}
              readOnly
              schema={schema}
              type={type}
              value={document}
            />
          )}
        </form>
      </>
    )
  }
}
