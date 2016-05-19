import React, {PropTypes} from 'react'

import jsonMarkup from 'json-markup'

import {
  FormBuilderValue,
  FormBuilder,
  FormBuilderProvider
} from '../../src'

const DEBUG_JSON_STYLE = {
  zIndex: 10000,
  overflow: 'scroll',
  padding: 50,
  backgroundColor: 'white',
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0
}

function restore(schema, type) {
  try {
    return JSON.parse(localStorage.getItem(`form-builder-demo-${schema.name}-${type.name}`))
  } catch (error) {
    console.log('Error reading from local storage: ', error)
  }
}

function save(schema, type, editorValue) {
  localStorage.setItem(`form-builder-demo-${schema.name}-${type.name}`, JSON.stringify(FormBuilderValue.unwrap(editorValue)))
}

export default React.createClass({

  propTypes: {
    schema: PropTypes.object.isRequired,
    resolveFieldInput: PropTypes.func.isRequired,
    type: PropTypes.object.isRequired
  },

  getInitialState() {
    const {schema, type} = this.props
    return {
      value: restore(schema, type) || void 0,
      saved: false,
      shouldInspect: false
    }
  },

  handleChange(newVal) {
    this.setState({
      shouldInspect: false,
      saved: false,
      value: newVal
    })
  },

  read() {
    try {
      return JSON.parse(localStorage.getItem('form-builder-demo'))
    } catch (error) {
      console.log('Error reading from local storage: ', error)
    }
    return null
  },

  clear() {
    this.setState({value: void 0})
  },

  save() {
    const {value} = this.state
    const {schema, type} = this.props
    save(schema, type, value)
    this.setState({saved: true})
  },

  componentDidUpdate(prevProps, prevState) {
    if (prevState.shouldInspect !== this.state.shouldInspect) {
      document.body.style.overflow = this.state.shouldInspect ? 'hidden' : ''
    }
  },

  render() {
    const {value, saved, shouldInspect} = this.state
    const {schema, type, resolveFieldInput} = this.props

    if (shouldInspect) {
      console.log('CURRENT VALUE', value)
    }

    return (
      <div className="content">
        <button onClick={() => this.save()}>{saved ? 'Saved' : 'Save'} to local storage</button>
        <button onClick={() => this.clear()}>Clear value</button>
        {!shouldInspect && <button onClick={() => this.setState({shouldInspect: true})}>Inspect</button>}
        {shouldInspect && (
          <div style={DEBUG_JSON_STYLE}>
            <button onClick={() => this.setState({shouldInspect: false})}>Close</button>
            <h3>The unwrapped value is serialized here:</h3>
            <pre>
              <code
                dangerouslySetInnerHTML={{__html: jsonMarkup(FormBuilderValue.unwrap(value))}}>
              </code>
            </pre>
            <p>Check the console for the internal representation of the form builder value(s)</p>
          </div>
        )}

        <form className="form-container">
          <h2>Generated form</h2>

          <FormBuilderProvider
            resolveFieldInput={resolveFieldInput}
            schema={schema.types}
          >
            <FormBuilder
              type={type}
              value={value}
              onChange={this.handleChange}
            />

          </FormBuilderProvider>
        </form>

        <h2>Parsed type</h2>
        <pre>{JSON.stringify(type, null, 2)}</pre>
      </div>
    )
  }
})
