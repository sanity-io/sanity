import React, {PropTypes} from 'react'

import FormBuilder from '../../src/FormBuilder'
import FormBuilderPropTypes from '../../src/FormBuilderPropTypes'
import {pick} from 'lodash'
import inspect from 'object-inspect'
import jsonMarkup from 'json-markup'

import schema from '../../schema-format'
import String from '../../src/field-builders/String'
import Number from '../../src/field-builders/Number'
import Image from '../../src/field-builders/Image'
import StringList from '../../src/field-builders/StringList'
import RichText from '../../src/field-builders/RichText'
import * as FormBuilderUtils from '../../src/FormBuilderUtils'


const fieldInputs = {
  richText: () => RichText,
  string: () => String,
  tag: () => String,
  number: () => Number,
  list: field => {
    if (field.of.every(type => type.name === 'string')) {
      return StringList
    }
    return StringList // todo: better list
  },
  image: () => Image
}

function resolveFieldInput(field) {
  // todo: smarter resolution algorithm

  const type = field.type
  const resolver = fieldInputs[type]

  if (!resolver) {
    return null
  }

  const resolved = resolver(field);
  //console.log('resolved field builder %s => %s:', field.type, type)
  return resolved
}

const FormBuilderProvider = React.createClass({
  propTypes: {
    resolveFieldInput: PropTypes.func.isRequired,
    children: PropTypes.node,
    editType: FormBuilderPropTypes.type,
    schema: FormBuilderPropTypes.schema
  },
  childContextTypes: {
    resolveFieldInput: PropTypes.func.isRequired,
    schema: FormBuilderPropTypes.schema
  },

  getChildContext() {
    return pick(this.props, 'schema', 'resolveFieldInput')
  },

  render() {
    return this.props.children
  }
})

export default React.createClass({
  getInitialState() {
    return {
      value: this.read() || {},
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
  save() {
    const {value} = this.state
    localStorage.setItem('form-builder-demo', JSON.stringify(FormBuilderUtils.unwrap(value)))
    this.setState({saved: true})
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
        {!shouldInspect && <button onClick={() => this.setState({shouldInspect: true})}>INSPECT VALUE</button>}
        {shouldInspect && (
          <div style={{overflow: 'scroll', padding: 50, backgroundColor: 'white', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0}}>
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
            schema={schema}
          >
            <FormBuilder
              typeName="story"
              value={value}
              onChange={this.handleChange}
            />
          </FormBuilderProvider>
        </form>
      </div>
    )
  }
})
