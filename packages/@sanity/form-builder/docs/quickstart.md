# Quickstart

## Use standalone
```js
import React from 'react'
import ReactDOM from 'react-dom'
import {FormBuilder} from '@sanity/form-builder'
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

let currentValue = {_type: 'book'}

function handleChange(event) {
  console.log('Received a patch:', event.patch)
  currentValue = currentValue.patch(event.patch)
  render()
}

function render() {
  const mountNode = document.getElementById('some-container')
  ReactDOM.render((
    <FormBuilder
      schema={schema}
      value={currentValue}
      onChange={handleChange}
    />
  ), mountNode)
}

// Initial render
document.addEventListener('DOMContentLoaded', render)
```

## Use as component

```js
class MyComponent extends React.Component {
  constructor(...args) {
    super(...args)
    this.handleChange = this.handleChange.bind(this)
    this.state = {
      editorValue: {_type: 'book'}
    }
  }
  
  handleChange(event) {
    this.setState({editorValue: this.state.editorValue.patch(event.patch)})
  }

  render() {
   return (
      <div>
        {/* ... */}
        <FormBuilder schema={schema} value={this.state.editorValue} onChange={this.handleChange} />
      </div>
    )
  }
}
```

