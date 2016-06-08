import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import {Editor, EditorState, ContentState, convertToRaw, convertFromRaw} from 'draft-js'
import htmlToDraft from './draft-utils/htmlToDraft'
import draftToHtml from './draft-utils/draftToHtml'

class DraftJSValueContainer {
  static deserialize(rawValue) {
    return new DraftJSValueContainer(
      rawValue
      ? EditorState.createWithContent(ContentState.createFromBlockArray(htmlToDraft(rawValue)))
      : EditorState.createEmpty()
    )
  }

  constructor(value) {
    this.editorState = value
  }

  serialize() {
    return draftToHtml(convertToRaw(this.editorState.getCurrentContent()))
  }
}

export default class extends React.Component {
  static valueContainer = DraftJSValueContainer;

  static propTypes = {
    field: FormBuilderPropTypes.field.isRequired,
    value: PropTypes.object,
    onChange: PropTypes.func
  };

  static defaultProps = {
    onChange() {}
  };

  constructor(props, context) {
    super(props, context)
    this.handleChange = this.handleChange.bind(this)
  }

  handleChange(editorState) {
    this.props.onChange(editorState)
  }

  render() {
    const {field, value} = this.props
    return (
      <div style={{borderWidth: 1, borderColor: 'gray', borderStyle: 'solid'}}>
        <Editor
          placeholder={field.placeholder}
          onChange={this.handleChange}
          editorState={value}
        />
      </div>
    )
  }
}
