import React, {PropTypes} from 'react'
import String from '../../String'
import ItemForm from '../ItemForm'

const stopPropagation = e => {
  e.stopPropagation()
}

export default class Video extends React.Component {
  constructor() {
    super()
    this.state = {isEditing: false}
  }

  handleChange = e => {
    const {node, state, editor} = this.props
    const next = editor
      .getState()
      .transform()
      .setNodeByKey(node.key, {
        data: {value: node.data.get('value').patch(e.patch)}
      })
      .apply()

    editor.onChange(next)
  }

  startEdit = e => {
    this.setState({isEditing: true})
  }

  endEdit = e => {
    this.setState({isEditing: false})
  }

  renderVideo() {
    const value = this.props.node.data.get('value')
    return (
      <div>
        {value.toJSON()}
      </div>
    )
  }

  renderInput() {
    const value = this.props.node.data.get('value')
    const {isEditing} = this.state
    return (
      <div>
        {!isEditing && <button onClick={this.startEdit}>EDIT VIDEO</button>}
        {isEditing && (
          <div onClick={stopPropagation}>
            <ItemForm
              field={{type: 'string', title: 'video'}}
              level={0}
              value={value}
              onChange={this.handleChange}
            />
            <button onClick={this.endEdit}>OK</button>
          </div>
        )}
      </div>
    )
  }

  render() {
    return (
      <div {...this.props.attributes} style={{border: '1px solid #aaa'}}>
        {this.renderVideo()}
        {this.renderInput()}
      </div>
    )
  }
}
