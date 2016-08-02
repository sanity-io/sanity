import React from 'react'
import {createFormBuilder, Schema} from '../../src'

const schema = Schema.compile({
  name: 'simple',
  types: [
    {
      name: 'book',
      type: 'object',
      fields: [
        {
          name: 'title',
          type: 'string',
          title: 'Book title'
        },
        {
          name: 'author',
          type: 'string',
          title: 'Name of author'
        },
        {
          name: 'isbn',
          type: 'string',
          title: 'ISBN'
        }
      ]
    }
  ]
})

const FormBuilder = createFormBuilder({schema: schema})

export default class QuickstartExample extends React.Component {
  constructor(...args) {
    super(...args)
    this.handleChange = this.handleChange.bind(this)
    this.state = {
      editorValue: FormBuilder.createEmpty('book')
    }
  }

  handleChange(event) {
    this.setState({editorValue: this.state.editorValue.patch(event.patch)})
  }

  render() {
    return (
      <div>
        {/* ... */}
        <FormBuilder value={this.state.editorValue} onChange={this.handleChange} />
      </div>
    )
  }
}
