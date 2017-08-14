import PropTypes from 'prop-types'
import React from 'react'
import {withRouterHOC} from 'part:@sanity/base/router'
import Pane from 'part:@sanity/components/panes/default'
import FrontendPreview from 'part:@sanity/desk-tool/frontend-preview?'
import {checkout} from 'part:@sanity/form-builder'
import {getDraftId, getPublishedId} from '../utils/draftUtils'

export default class FrontendPreviewPane extends React.PureComponent {

  static propTypes = {
    documentId: PropTypes.string,
    type: PropTypes.object
  }

  state = {
    published: null,
    draft: null
  }
  componentDidMount() {
    const {documentId} = this.props
    this.publishedSubscription = checkout(getPublishedId(documentId)).events
      .subscribe(ev => {
        this.setState({published: ev.document})
      })

    this.draftSubscription = checkout(getDraftId(documentId)).events
      .subscribe(ev => {
        this.setState({draft: ev.document})
      })
  }

  componentWillUnmount() {
    this.publishedSubscription.unsubscribe()
    this.draftSubscription.unsubscribe()
  }

  render() {
    const {documentId, type} = this.props
    const {draft, published} = this.state

    return (
      <Pane title="Preview">
        <FrontendPreview
          documentId={documentId}
          type={type}
          draft={draft}
          published={published}
        />
      </Pane>
    )
  }
}
