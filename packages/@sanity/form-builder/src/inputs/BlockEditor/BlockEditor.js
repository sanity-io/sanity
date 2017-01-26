import React, {PropTypes} from 'react'
import ProseMirrorValueContainer from './ProseMirrorValueContainer'
import {ProseMirror} from 'prosemirror'
import EditBlock from './EditBlock'
import {createMemberValue} from '../../state/FormBuilderState'
import createProseMirrorSchema from './createProseMirrorSchema'
import styles from './styles/BlockEditor.css'

export default class BlockEditor extends React.Component {
  static valueContainer = ProseMirrorValueContainer

  static propTypes = {
    type: PropTypes.any,
    value: PropTypes.instanceOf(ProseMirrorValueContainer),
    validation: PropTypes.shape({
      errors: PropTypes.array
    }),
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
    this.handleEditDone = this.handleEditDone.bind(this)
    this.handleEditorClick = this.handleEditorClick.bind(this)
    this.handleBlockChange = this.handleBlockChange.bind(this)
    this.setEditorRef = this.setEditorRef.bind(this)
  }

  componentDidMount() {

    const {jsonValue} = this.props.value

    const createBlockValue = (type, value) => createMemberValue(value, {
      type: type,
      schema: this.context.schema,
      resolveInputComponent: this.context.resolveInputComponent
    })

    this.pmSchema = createProseMirrorSchema({
      type: this.props.type,
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
      // todo: revisit
      console.log('Editor document are out of sync with value.doc') // eslint-disable-line no-console
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

  handleEditDone(event) {
    this.setState({edit: null})
  }

  handleInsertBlock(event) {
    const schema = this.pmSchema
    const nodeTypeName = event.target.getAttribute('data-type')
    const nodeType = schema.nodes[nodeTypeName]
    this.pm.tr.replaceSelection(nodeType.create()).applyAndScroll()
  }

  renderInsertMenu() {
    const {type} = this.props
    return (
      <div>
        {type.of.map(ofField => {
          return (
            <button
              key={ofField.type}
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
      <EditBlock
        value={edit.value}
        type={edit.value.context.type}
        onChange={this.handleBlockChange}
        onClose={this.handleEditDone}
        onEnter={this.handleEditDone}
      />
    )
  }
  render() {
    const {validation} = this.props
    const hasError = validation && validation.messages && validation.messages.length > 0
    return (
      <div className={hasError ? styles.error : styles.root}>
        {this.renderInsertMenu()}
        <div className={styles.inner}>
          <div
            className={hasError ? styles.inputError : styles.input}
            ref={this.setEditorRef}
          />
        </div>
        {this.renderBlockForm()}
      </div>
    )
  }
}
