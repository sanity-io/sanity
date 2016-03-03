import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import {Editor, EditorState, ContentState, convertToRaw, convertFromRaw} from 'draft-js'

export default React.createClass({
  propTypes: {
    field: FormBuilderPropTypes.field.isRequired,
    value: PropTypes.object,
    onChange: PropTypes.func
  },

  statics: {
    valueContainer: {
      wrap(raw) {
        return raw
          ? EditorState.crateFromBlockArray(convertFromRaw(raw))
          : EditorState.createEmpty()
      },
      unwrap(editorState) {
        return convertToRaw(editorState.getCurrentContent())
      }
    }
  },

  getDefaultProps() {
    return {
      onChange() {
      }
    }
  },

  handleChange(editorState) {
    this.props.onChange(editorState)
  },

  render() {
    const {field, value} = this.props
    return (
      <Editor
        placeholder={field.placeholder}
        onChange={this.handleChange}
        editorState={value}
      />
    )
  }

})
