import React from 'react'
import FormBuilder from '../../src'
import applyPatch from '../../src/simplePatch'
import Schema from '@sanity/schema'

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

export default class QuickstartExample extends React.Component {
  state = {
    editorValue: undefined
  }

  handleLogClick = event => {
    // eslint-disable-next-line no-console
    console.log(this.state.editorValue.toJSON())
  }

  handleChange = event => {
    this.setState({editorValue: applyPatch(this.state.editorValue, event.patch)})
  }

  render() {
    return (
      <div>
        <FormBuilder schema={schema} value={this.state.editorValue} onChange={this.handleChange} />
        <button type="button" onClick={this.handleLogClick}>
          Output current value to console
        </button>
      </div>
    )
  }
}
