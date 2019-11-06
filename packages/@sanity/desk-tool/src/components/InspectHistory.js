import React from 'react'
import PropTypes from 'prop-types'
import {from} from 'rxjs'
import Spinner from 'part:@sanity/components/loading/spinner'
import historyStore from 'part:@sanity/base/datastore/history'
import InspectView from './InspectView'

export default class InspectHistory extends React.PureComponent {
  static propTypes = {
    event: PropTypes.shape({
      displayDocumentId: PropTypes.string.isRequired,
      rev: PropTypes.string.isRequired
    }).isRequired,
    onClose: PropTypes.func.isRequired
  }

  state = {
    document: undefined
  }

  componentDidMount() {
    const {displayDocumentId, rev} = this.props.event
    this.fetch(displayDocumentId, rev)
  }

  componentWillUnmount() {
    this.dispose()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.event !== this.props.event) {
      const {displayDocumentId, rev} = this.props.event
      this.fetch(displayDocumentId, rev)
    }
  }

  dispose() {
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
  }

  fetch(id, rev) {
    this.dispose()

    this.subscription = from(historyStore.getDocumentAtRevision(id, rev)).subscribe(document => {
      this.setState({document})
    })
  }

  render() {
    return this.state.document ? (
      <InspectView value={this.state.document} onClose={this.props.onClose} />
    ) : (
      <Spinner />
    )
  }
}
