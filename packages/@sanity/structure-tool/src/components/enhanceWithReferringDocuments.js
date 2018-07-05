import React from 'react'
import PropTypes from 'prop-types'
import documentStore from 'part:@sanity/base/datastore/document'

export default function withReferringDocuments(Component) {
  return class extends React.PureComponent {
    static displayName = `enhanceWithAvailHeight(${Component.displayName || Component.name})`

    static propTypes = {
      published: PropTypes.object
    }

    state = {
      isLoading: false,
      referringDocuments: []
    }

    componentDidMount() {
      const {published} = this.props
      if (!published) {
        return
      }
      this.setState({isLoading: true})
      this.refSubscription = documentStore
        .query('*[references($docId)] [0...101]', {docId: published._id})
        .subscribe(event => {
          this.setState({
            referringDocuments: event.documents || [],
            isLoading: false
          })
        })
    }

    componentWillUnmount() {
      if (this.refSubscription) {
        this.refSubscription.unsubscribe()
      }
    }

    render() {
      const {isLoading, referringDocuments} = this.state
      return (
        <Component
          {...this.props}
          referringDocuments={referringDocuments}
          isCheckingReferringDocuments={isLoading}
        />
      )
    }
  }
}
