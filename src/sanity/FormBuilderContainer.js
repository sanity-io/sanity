import React, {PropTypes} from 'react'
import equals from 'shallow-equals'
import client from 'client:@sanity/base/client'
import SanityFormBuilder from './SanityFormBuilder'

class FormBuilderContainer extends React.Component {
  constructor() {
    super()

    this.state = {
      loading: true
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !equals(this.props, nextProps) || !equals(this.state, nextState)
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.documentId === nextProps.documentId) {
      return
    }

    this.fetchDocument(nextProps.documentId)
  }

  componentDidMount() {
    this.fetchDocument(this.props.documentId)
  }

  fetchDocument(documentId) {
    client.fetch('*[.$id == %id]', {id: documentId}).then(res =>
      this.setState({
        loading: false,
        document: res && res.result && res.result[0]
      })
    )
  }

  render() {
    if (this.state.loading) {
      return <div>Loading document...</div>
    }
    return (
      <SanityFormBuilder initialValue={this.state.document} />
    )
  }
}

FormBuilderContainer.propTypes = {
  documentId: PropTypes.string
}

export default FormBuilderContainer
