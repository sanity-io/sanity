import React, {PropTypes} from 'react'
import SlateValueContainer from './SlateValueContainer'
import {Editor, Character} from 'slate'
import CorePlugin from 'slate/dist/plugins/core'
// import EditBlock from './EditBlock'
import {createFieldValue} from '../../state/FormBuilderState'
// import createProseMirrorSchema from './createProseMirrorSchema'
import styles from './styles/BlockEditor.css'

const corePlugin = CorePlugin()

export default class BlockEditor extends React.Component {
  static valueContainer = SlateValueContainer

  static propTypes = {
    type: PropTypes.any,
    field: PropTypes.any,
    value: PropTypes.instanceOf(SlateValueContainer),
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
    this.handleChange = this.handleChange.bind(this)
    this.handleBeforeInput = this.handleBeforeInput.bind(this)
  }

  componentDidMount() {
  }

  componentWillUnmount() {
  }

  componentWillReceiveProps(nextProps) {
  }

  handleInsertBlock(e) {
    const {onChange} = this.props
  }

  renderInsertMenu() {
    const {field} = this.props
    return (
      <div>
        {field.of.map(ofField => {
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

  handleChange(nextState) {
    const {onChange} = this.props
    onChange({
      patch: {
        localState: nextState
      }
    })
  }

  handleBeforeInput(e, data, state, editor) {
    const {onChange} = this.props

    onChange({
      patch: {
        insertText: e.data
      }
    })
  }

  render() {
    const {validation, value} = this.props
    const hasError = validation && validation.messages && validation.messages.length > 0
    return (
      <div className={hasError ? styles.error : styles.root}>
        {this.renderInsertMenu()}
        <Editor
          placeholder=""
          plugins={[]}
          state={value.state}
          renderNode={this.renderNode}
          renderMark={this.renderMark}
          onBeforeInput={this.handleBeforeInput}
          onChange={this.handleChange}
        />
      </div>
    )
  }
}
