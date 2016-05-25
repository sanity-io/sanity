import React, {PropTypes} from 'react'
import equals from 'shallow-equals'
import client from 'client:@sanity/base/client'
import EditorBuilder from './EditorBuilder'
import {
  compileSchema,
  fieldInputs as defaultFieldInputs
} from '@sanity/form-builder'

class EditorContainer extends React.Component {
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
    client.fetch('*[.$id == %id]', {id: documentId})
      .then(items => this.setState({
        loading: false,
        document: items && items[0]
      }))
  }

  render() {
    if (this.state.loading) {
      return <div>Loading document...</div>
    }

    const compiledSchema = compileSchema(this.props.schema)
    const type = compiledSchema.types[this.props.typeName]

    const fieldInputs = Object.assign({}, defaultFieldInputs)
    Object.keys(compiledSchema.types).forEach(typeName => {
      const typeDef = compiledSchema.types[typeName]
      if (!fieldInputs[typeName] && fieldInputs[typeDef.type]) {
        fieldInputs[typeName] = fieldInputs[typeDef.type]
      }
    })

    const resolveFieldInput = field => fieldInputs[field.type]

    return (
      <EditorBuilder
        schema={compiledSchema}
        type={type}
        resolveFieldInput={resolveFieldInput}
        initialValue={this.state.document}
      />
    )
  }
}

EditorContainer.propTypes = {
  documentId: PropTypes.string,
  typeName: PropTypes.string,
  schema: PropTypes.object
}

export default EditorContainer
