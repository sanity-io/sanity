import React from 'react'
import PropTypes from 'prop-types'
import InspectView from './InspectView'
import Spinner from 'part:@sanity/components/loading/spinner'
import historyStore from 'part:@sanity/base/datastore/history'

export default class InspectHistory extends React.PureComponent {
  static propTypes = {
    event: PropTypes.object.isRequired,
    onClose: PropTypes.func
  }

  state = {
    document: undefined
  }

  componentDidMount() {
    const {displayDocumentId, rev} = this.props.event
    this.fetch(displayDocumentId, rev)
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.event !== this.props.event) {
      const {displayDocumentId, rev} = nextProps.event
      this.fetch(displayDocumentId, rev)
    }
  }

  fetch(id, rev) {
    historyStore.getDocumentAtRevision(id, rev).then(document => {
      this.setState({document})
    })
  }

  render() {
    if (this.state.document) {
      return <InspectView value={this.state.document} onClose={this.props.onClose} />
    }
    return <Spinner />
  }
}
