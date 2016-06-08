import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import {Editor, EditorState, ContentState, convertToRaw, convertFromRaw} from 'draft-js'
import htmlToDraft from './draft-utils/htmlToDraft'
import draftToHtml from './draft-utils/draftToHtml'

const EMPTY_EDITORSTATE = EditorState.createEmpty()

// This is a very simple example that passes editor state around. Not not meant for production, just as an example
class DraftJSValueContainer {
  static deserialize(rawValue) {
    return new DraftJSValueContainer(
      rawValue
      ? EditorState.createWithContent(ContentState.createFromBlockArray(htmlToDraft(rawValue)))
      : EMPTY_EDITORSTATE
    )
  }

  patch(patch) {
    if (!patch.$setState || !(patch.$setState instanceof EditorState)) {
      throw new Error('The only allowed patch operation are $set and its value must be a new EditorState')
    }
    return new DraftJSValueContainer(patch.$setState)
  }

  constructor(editorState) {
    this.editorState = editorState
  }

  serialize() {
    return draftToHtml(convertToRaw(this.editorState.getCurrentContent()))
  }
}

export default class extends React.Component {
  static valueContainer = DraftJSValueContainer;

  static propTypes = {
    field: FormBuilderPropTypes.field.isRequired,
    value: PropTypes.instanceOf(DraftJSValueContainer),
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
    this.props.onChange({patch: {$setState: editorState}})
  }

  render() {
    const {field, value} = this.props
    return (
      <div style={{borderWidth: 1, borderColor: 'gray', borderStyle: 'solid'}}>
        <Editor
          placeholder={field.placeholder}
          onChange={this.handleChange}
          editorState={value ? value.editorState : EMPTY_EDITORSTATE}
        />
      </div>
    )
  }
}
