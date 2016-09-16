import React, {PropTypes} from 'react'
import ItemPreview from './ItemPreview'
import {bindAll} from 'lodash'
import ItemForm from './ItemForm'
const stopPropagation = e => e.stopPropagation()

export default function createFormBuilderPreviewNode(ofField) {
  return class PreviewNode extends React.Component {
    state = {isEditing: false}

    handleChange = event => {
      const {node, state, editor} = this.props
      const next = editor
        .getState()
        .transform()
        .setNodeByKey(node.key, {
          data: {value: node.data.get('value').patch(event.patch)}
        })
        .apply()

      editor.onChange(next)
    }

    handleEndEdit = () => {
      this.setState({isEditing: false})
    }

    handleStartEdit = () => {
      this.setState({isEditing: true})
    }

    getValue() {
      return this.props.node.data.get('value')
    }

    renderEdit() {
      const {key} = this.props.node

      return (
        <div onClick={stopPropagation}>
          <ItemForm
            field={ofField}
            level={0}
            value={this.getValue()}
            onChange={this.handleChange}
          />
          <button type="button" onClick={this.handleEndEdit}>OK</button>
        </div>
      )
    }

    renderPreview() {
      return (
        <ItemPreview
          field={ofField}
          value={this.getValue()}
        />
      )
    }

    renderInput() {
      const {isEditing} = this.state
      return (
        <div>
          {!isEditing && <button onClick={this.handleStartEdit}>EDIT</button>}
          {isEditing && (
            <div onClick={stopPropagation}>
              <ItemForm
                field={ofField}
                level={0}
                value={this.getValue()}
                onChange={this.handleChange}
              />
              <button onClick={this.handleEndEdit}>OK</button>
            </div>
          )}
        </div>
      )
    }

    render() {
      return (
        <div {...this.props.attributes} style={{border: '1px dashed #aaa'}}>
          {this.renderPreview()}
          {this.renderInput()}
        </div>
      )
    }
  }
}
