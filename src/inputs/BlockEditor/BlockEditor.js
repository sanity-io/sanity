import React, {PropTypes} from 'react'
import ProseMirrorValueContainer from './ProseMirrorValueContainer'
import {ProseMirror} from 'prosemirror'
import EditBlock from './EditBlock'
import {createFieldValue} from '../../state/FormBuilderState'
import createProseMirrorSchema from './createProseMirrorSchema'

export default class BlockEditor extends React.Component {
  static valueContainer = ProseMirrorValueContainer

  static propTypes = {
    type: PropTypes.any,
    field: PropTypes.any,
    value: PropTypes.instanceOf(ProseMirrorValueContainer),
    onChange: PropTypes.func
  }

  static defaultProps = {
    onChange() {}
  }

  static contextTypes = {
    schema: PropTypes.object,
    resolveInputComponent: PropTypes.func,
    resolvePreviewComponent: PropTypes.func
  }

  constructor(props, context) {
    super(props, context)
    this.state = {
      editEntity: null
    }
    this.handleInsertBlock = this.handleInsertBlock.bind(this)
    this.handleEditorClick = this.handleEditorClick.bind(this)
    this.handleBlockChange = this.handleBlockChange.bind(this)
    this.setEditorRef = this.setEditorRef.bind(this)
  }

  componentDidMount() {

    const {jsonValue} = this.props.value

    const createBlockValue = (field, value) => createFieldValue(value, {
      field: field,
      schema: this.context.schema,
      resolveInputComponent: this.context.resolveInputComponent
    })

    this.pmSchema = createProseMirrorSchema({
      field: this.props.field,
      onChange: this.handleItemChange,
      createBlockValue: createBlockValue,
      parentComponent: this
    })

    const doc = this.pmSchema.nodeFromJSON(jsonValue)

    this.pm = new ProseMirror({
      place: this.pmContainer,
      schema: this.pmSchema,
      doc: doc
    })

    this.props.value.attachPM(this.pm)
    this.pm.on.clickOn.add(this.handleEditorClick)
  }

  componentWillUnmount() {
    this.pm.on.clickOn.remove(this.handleEditorClick)
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.value.doc !== this.pm.doc) {
      // oops, docs are out of sync
      console.log('Editor document are out of sync with value.doc')
    }
  }

  handleEditorClick(pos, node, nodePos) {
    if (node.type.isFormBuilderType) {
      const value = node.attrs.value
      this.setState({edit: {pos, node, nodePos, value: value}})
      return false
    }
    this.setState({edit: null})
    return true
  }

  setEditorRef(element) {
    this.pmContainer = element
  }

  handleInsertBlock(event) {
    const schema = this.pmSchema
    const nodeTypeName = event.target.getAttribute('data-type')
    const nodeType = schema.nodes[nodeTypeName]
    this.pm.tr.replaceSelection(nodeType.create()).applyAndScroll()
  }

  renderInsertMenu() {
    const {field} = this.props
    return (
      <div>
        {field.of.map(ofField => {
          return (
            <button
              key={ofField.type}
              type="button"
              data-type={ofField.type}
              onClick={this.handleInsertBlock}
            >
              Insert {ofField.title}
            </button>
          )
        })}
      </div>
    )
  }

  handleBlockChange(ev) {
    const {node, nodePos, value} = this.state.edit

    const nextValue = value.patch(ev.patch)

    this.pm.tr.setNodeType(nodePos, node.type, {
      value: nextValue
    }).apply()

    this.setState({
      edit: {
        node,
        nodePos,
        value: nextValue
      }
    })
  }

  renderBlockForm() {
    const {edit} = this.state

    if (!edit) {
      return null
    }

    return (
      <EditBlock value={edit.value} field={edit.value.context.field} onChange={this.handleBlockChange} />
    )
  }
  render() {
    return (
      <div style={{position: 'relative'}}>
        {this.renderInsertMenu()}
        <div ref={this.setEditorRef} />
        {this.renderBlockForm()}
      </div>
    )
  }
}
