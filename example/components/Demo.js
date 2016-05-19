import React, {PropTypes} from 'react'

import FormBuilderProvider from '../../src/FormBuilderProvider'
import {FormBuilder} from '../../src/FormBuilder'
import jsonMarkup from 'json-markup'

import * as FormBuilderUtils from '../../src/FormBuilderUtils'

import schema from '../../example-schema'
import Obj from '../../src/field-inputs/Object'
import Arr from '../../src/field-inputs/Array'
import Bool from '../../src/field-inputs/Boolean'
import Num from '../../src/field-inputs/Number'
import RichText from '../../src/field-inputs/RichText'
import Reference from '../../src/field-inputs/Reference'
import Str from '../../src/field-inputs/String'
import Url from '../../src/field-inputs/Url'
import {compile} from '../../src/compileSchema'

const compiledSchema = compile(schema)

const inputs = {
  object: Obj,
  string: Str,
  number: Num,
  boolean: Bool,
  array: Arr,
  reference: Reference,
  text: RichText,
  url: Url
}

Object.keys(compiledSchema.types).forEach(typeName => {
  const typeDef = compiledSchema.types[typeName]
  if (inputs[typeDef.type]) {
    inputs[typeName] = inputs[typeDef.type]
  }
})

function resolveFieldInput(field, type) {
  return inputs[field.type]
}

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

function restore() {
  try {
    return JSON.parse(localStorage.getItem('form-builder-demo'))
  } catch (e) {
    console.log('Error reading from local storage: ', e)
  }
  return null
}

function save(editorValue) {
  localStorage.setItem('form-builder-demo', JSON.stringify(FormBuilderUtils.unwrap(editorValue)))
}

export default React.createClass({

  getInitialState() {
    return {
      value: restore() || {},
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
    } catch (e) {
      console.log('Error reading from local storage: ', e)
    }
    return null
  },

  clear() {
    this.setState({value: {}})
  },

  save() {
    const {value} = this.state
    save(value)
    this.setState({saved: true})
  },

  componentDidUpdate(prevProps, prevState) {
    if (prevState.shouldInspect !== this.state.shouldInspect) {
      document.body.style.overflow = this.state.shouldInspect ? 'hidden' : ''
    }
  },

  render() {
    const {value, saved, shouldInspect} = this.state

    if (shouldInspect) {
      console.log('CURRENT VALUE', value)
    }

    return (
      <div className="content">
        <h2>Form value</h2>
        <button onClick={() => this.save()}>{saved ? 'Saved' : 'Save'} to local storage</button>
        <button onClick={() => this.clear()}>Clear value</button>
        {!shouldInspect && <button onClick={() => this.setState({shouldInspect: true})}>Inspect</button>}
        {shouldInspect && (
          <div style={DEBUG_JSON_STYLE}>
            <button onClick={() => this.setState({shouldInspect: false})}>Close</button>
            <h3>The unwrapped value is serialized here:</h3>
            <pre>
              <code
                dangerouslySetInnerHTML={{__html: jsonMarkup(FormBuilderUtils.unwrap(value))}}>
              </code>
            </pre>
            <p>Check the console for the internal representation of the form builder value(s)</p>
          </div>
        )}

        <form className="form-container">
          <h2>Generated form</h2>

          <FormBuilderProvider
            resolveFieldInput={resolveFieldInput}
            schema={compiledSchema.types}
          >
            <FormBuilder
              type={compiledSchema.types.venue}
              value={value}
              onChange={this.handleChange}
            />

          </FormBuilderProvider>
        </form>

        <pre>{JSON.stringify(compiledSchema.types, null, 2)}</pre>
      </div>
    )
  }
})
