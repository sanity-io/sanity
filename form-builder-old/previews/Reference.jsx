import React from 'react'
import Dispatchable from '../../../lib/mixins/Dispatchable'

export default React.createClass({
  displayName: 'Reference',
  mixins: [Dispatchable],

  propTypes: {
    value: React.PropTypes.any.isRequired,
    fieldPreviews: React.PropTypes.object.isRequired
  },

  getInitialState() {
    return {
      document: null,
      loading: true
    }
  },

  actions: {
    DOCUMENT_READY({document}) {
      if (document.id == this.props.value.id) {
        this.setState({
          loading: false,
          document: document
        })
      }
    }
  },

  componentDidMount() {
    this.appDispatcher.requestDocument(this.props.value.id)
  },

  componentWillReceiveProps(nextProps) {
    if (this.props.id !== nextProps.id) {
      this.appDispatcher.requestDocument(this.props.value.id)
    }
  },

  render() {
    const {value, fieldPreviews} = this.props
    const {document, loading} = this.state

    if (loading) {
      return <div>Loading...</div>
    }

    if (!document) {
      return <div>Missing document for value {JSON.stringify(value)}...</div>
    }

    const FieldPreview = fieldPreviews[document.type] || fieldPreviews.default

    return (
      <div className="preview-item__reference">
        <FieldPreview value={document} reference={value}/>
      </div>
    )
  }
})
