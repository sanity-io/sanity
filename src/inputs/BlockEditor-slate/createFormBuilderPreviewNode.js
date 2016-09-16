import React, {PropTypes} from 'react'
import ItemPreview from './ItemPreview'
import styles from './styles/BlockPreview.css'
import ItemForm from './ItemForm'
const stopPropagation = e => e.stopPropagation()

export default function createFormBuilderPreviewNode(ofField) {
  return class PreviewNode extends React.Component {
    static propTypes = {
      node: PropTypes.object,
      editor: PropTypes.object,
      attributes: PropTypes.object
    }

    handleChange = event => {
      const {node, editor} = this.props
      const next = editor.getState()
        .transform()
        .setNodeByKey(node.key, {
          data: {value: node.data.get('value').patch(event.patch)}
        })
        .apply()

      editor.onChange(next)
    }

    getValue() {
      return this.props.node.data.get('value')
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
      const {node, editor} = this.props

      const isFocused = editor.getState().selection.hasEdgeIn(node)

      return isFocused ? (
        <div onClick={stopPropagation}>
          <ItemForm
            field={ofField}
            level={0}
            value={this.getValue()}
            onChange={this.handleChange}
          />
        </div>
      ) : null
    }

    render() {
      const {node, editor} = this.props
      const isFocused = editor.getState().selection.hasEdgeIn(node)
      const className = isFocused ? styles.active : styles.root

      return (
        <div {...this.props.attributes} draggable className={className}>
          {this.renderPreview()}
          {this.renderInput()}
        </div>
      )
    }
  }
}
