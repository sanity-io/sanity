import React, {PropTypes} from 'react'

import FormBuilder from '../../src/FormBuilder'
import FormBuilderPropTypes from '../../src/FormBuilderPropTypes'
import {pick} from 'lodash'
import inspect from 'object-inspect'

import schema from '../../schema-format'
import String from '../../src/field-builders/String'
import Number from '../../src/field-builders/Number'
import Image from '../../src/field-builders/Image'
import StringList from '../../src/field-builders/StringList'
import RichText from '../../src/field-builders/RichText'
//import Obj from '../../src/field-builders/Object'

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
  console.log('resolved field builder %s => %s:', field.type, type)
  return resolved
}
//
//function DefaultFieldRenderer(props) {
//  const {value, field, onChange, InputComponent} = props
//  return (
//    <fieldset>
//      <div>
//        <label>
//          {field.title}
//        </label>
//
//        {field.description && <div>{field.description}</div>}
//
//        <div>
//          <InputComponent
//            field={field}
//            onChange={onChange}
//            value={value}
//          />
//        </div>
//      </div>
//    </fieldset>
//  )
//}
//
function resolveFieldRenderer(field) {
  //return DefaultFieldRenderer
}

const FormBuilderProvider = React.createClass({
  propTypes: {
    resolveFieldInput: PropTypes.func.isRequired,
    resolveFieldRenderer: PropTypes.func.isRequired,
    children: PropTypes.node,
    editType: FormBuilderPropTypes.type,
    schema: FormBuilderPropTypes.schema
  },
  childContextTypes: {
    resolveFieldInput: PropTypes.func.isRequired,
    resolveFieldRenderer: PropTypes.func.isRequired,
    schema: FormBuilderPropTypes.schema
  },

  getChildContext() {
    return pick(this.props, 'schema', 'resolveFieldInput', 'resolveFieldRenderer')
  },

  render() {
    return this.props.children
  }
})

export default React.createClass({
  getInitialState() {
    return {
      value: {}
    }
  },
  handleChange(newVal) {
    this.setState({value: newVal})
  },
  render() {
    const {value} = this.state

    return (
      <div className="content">
        <form className="form-container">
          <h2>Generated form</h2>
          <FormBuilderProvider
            resolveFieldInput={resolveFieldInput}
            resolveFieldRenderer={resolveFieldRenderer}
            schema={schema}
          >
            <FormBuilder
              typeName="story"
              value={value}
              onChange={this.handleChange}
            />
          </FormBuilderProvider>
        </form>
        {inspect(value)}
      </div>
    )
  }
})
