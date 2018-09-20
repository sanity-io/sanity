import React from 'react'
import PropTypes from 'prop-types'
import client from 'part:@sanity/base/client'
import Spinner from 'part:@sanity/components/loading/spinner'

export default class JsonDocumentDump extends React.PureComponent {
  static propTypes = {
    itemId: PropTypes.string.isRequired
  }

  state = {isLoading: true}

  actionHandlers = {
    reload: () => this.setup()
  }

  setup() {
    this.dispose()
    this.setState({isLoading: true, document: undefined})

    const {itemId} = this.props
    const draftId = `drafts.${itemId}`
    const query = '*[_id in [$itemId, $draftId]]'
    const params = {itemId, draftId}

    this.document$ = client.observable
      .fetch(`${query} | order(_updatedAt desc) [0]`, params)
      .subscribe(document => this.setState({document, isLoading: false}))

    this.documentListener$ = client.observable
      .listen(query, params)
      .subscribe(mut => this.setState({document: mut.result, isLoading: false}))
  }

  dispose() {
    if (this.document$) {
      this.document$.unsubscribe()
      this.documentListener$.unsubscribe()
    }
  }

  componentDidMount() {
    this.setup()
  }

  componentWillUnmount() {
    this.dispose()
  }

  render() {
    const {isLoading, document} = this.state
    if (isLoading) {
      return <Spinner center message="Loading..." />
    }

    if (!document) {
      return <div>Document not found</div>
    }

    return (
      <pre>
        <code>{JSON.stringify(document, null, 2)}</code>
      </pre>
    )
  }
}
