import PropTypes from 'prop-types'
import React from 'react'
import {FormBuilderInput} from './FormBuilderInput'
import FormBuilderContext from './FormBuilderContext'

// Todo: consider deprecating this in favor of <FormBuilderContext ...><FormBuilderInput .../></FormBuilderContext>
export default class FormBuilder extends React.Component {
  static createPatchChannel = FormBuilderContext.createPatchChannel
  static propTypes = {
    value: PropTypes.any,
    schema: PropTypes.object.isRequired,
    type: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
    patchChannel: PropTypes.shape({
      onPatch: PropTypes.func
    }).isRequired,
    resolveInputComponent: PropTypes.func.isRequired,
    resolvePreviewComponent: PropTypes.func.isRequired
  }

  static defaultProps = {
    value: undefined
  }

  render() {
    const {
      schema,
      value,
      type,
      onChange,
      resolveInputComponent,
      resolvePreviewComponent,
      patchChannel
    } = this.props

    if (!schema) {
      throw new TypeError('You must provide a schema to <FormBuilder (...)')
    }

    return (
      <FormBuilderContext
        schema={schema}
        value={value}
        resolveInputComponent={resolveInputComponent}
        resolvePreviewComponent={resolvePreviewComponent}
        patchChannel={patchChannel}
      >
        <FormBuilderInput value={value} type={type} onChange={onChange} level={0} isRoot />
      </FormBuilderContext>
    )
  }
}
