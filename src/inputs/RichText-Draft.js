import React, {PropTypes} from 'react'
import FormBuilderPropTypes from '../FormBuilderPropTypes'
import {Editor, EditorState, ContentState, convertToRaw, convertFromRaw} from 'draft-js'
import htmlToDraft from './draft-utils/htmlToDraft'
import draftToHtml from './draft-utils/draftToHtml'

export default class extends React.Component {
  constructor(props, context) {
    super(props, context)
    this.handleChange = this.handleChange.bind(this)
  }

  static valueContainer = {
    wrap(raw) {
      return raw
        ? EditorState.createWithContent(ContentState.createFromBlockArray(htmlToDraft(raw)))
        : EditorState.createEmpty()
    },
    unwrap(editorState) {
      return draftToHtml(convertToRaw(editorState.getCurrentContent()))
    }
  };

  static propTypes = {
    field: FormBuilderPropTypes.field.isRequired,
    value: PropTypes.object,
    onChange: PropTypes.func
  };

  static defaultProps = {
    onChange() {}
  };

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
