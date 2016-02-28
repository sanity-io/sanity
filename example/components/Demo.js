import React, {PropTypes} from 'react'

import FormBuilder from '../../src/FormBuilder'
import FormBuilderPropTypes from '../../src/FormBuilderPropTypes'
import {pick} from 'lodash'
import inspect from 'object-inspect'

import rawSchema from '../../schema-format'
import String from '../../src/field-builders/String'
import Number from '../../src/field-builders/Number'
import Image from '../../src/field-builders/Image'
import StringList from '../../src/field-builders/StringList'
import RichText from '../../src/field-builders/RichText'
import Compound from '../../src/field-builders/Compound'


function linkSchema(inputSchema) {
  return inputSchema.map(type => {
    if (type.isPrimitive) {
      return type
    }
    if (type.fields) {
      return Object.assign({}, type, {
        fields: linkFields(type.fields)
      })
    }
    return type
  })

  function linkFields(fields) {
    return Object.keys(fields).reduce((linkedFields, fieldName) => {
      linkedFields[fieldName] = linkFieldType(fields[fieldName])
      return linkedFields
    }, {})
  }
  function linkFieldType(field) {
    const linkedField = Object.assign({}, field, {type: Object.assign({}, findTypeByName(field.type))})
    if (linkedField.type.name === 'list') {
      // Link items too
      linkedField.of = field.of.map(linkFieldType)
    }
    if (linkedField.type.name === 'reference') {
      // Link items too
      linkedField.to = field.to.map(linkFieldType)
    }
    if (linkedField.type.fields) {
      // Link fields too
      linkedField.type.fields = linkFields(linkedField.type.fields)
    }
    return linkedField
  }
  function findTypeByName(typeName) {
    return inputSchema.find(type => type.name === typeName)
  }
}


const schema = linkSchema(rawSchema)

console.log(schema)

const fieldInputs = {
  richText: () => RichText,
  string: () => String,
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

  const resolver = fieldInputs[field.type.alias || field.type.name]

  return resolver ? resolver(field) : Compound
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

    const story = schema.find(type => type.name === 'story')

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
              fields={story.fields}
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
