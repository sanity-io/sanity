import React, {PropTypes} from 'react'
import {Editor} from 'slate'
import InsertBlockOnEnter from 'slate-insert-block-on-enter'

import createPreviewNode from './createFormBuilderPreviewNode'
import mapToObject from './util/mapToObject'
import styles from './styles/BlockEditor.css'

import Mark from './Mark'
import SlateValueContainer from './SlateValueContainer'

import FormBuilderNodeOnDrop from './plugins/FormBuilderNodeOnDrop'
import FormBuilderNodeOnPaste from './plugins/FormBuilderNodeOnPaste'
import TextFormattingOnKeyDown from './plugins/TextFormattingOnKeyDown'


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
    formBuilder: PropTypes.object
  }

  constructor(props, context) {
    super(props, context)


    const {field} = this.props
    const paragraphField = field.of.find(ofField => ofField.type === 'paragraph')
    const allowedMarks = paragraphField.marks || []
    this.slateSchema = {
      nodes: mapToObject(field.of.filter(ofField => ofField !== paragraphField), ofField => {
        return [ofField.type, createPreviewNode(ofField)]
      }),
      marks: mapToObject(allowedMarks, mark => {
        return [mark, Mark]
      })
    }

    this.slatePlugins = [
      InsertBlockOnEnter({kind: 'block', type: 'paragraph', nodes: [{kind: 'text', text: '', ranges: []}]}),
      FormBuilderNodeOnDrop(),
      FormBuilderNodeOnPaste(this.context.formBuilder, this.props.field.of),
      TextFormattingOnKeyDown()
    ]
  }

  handleInsertBlock = event => {
    const {value, onChange, field} = this.props
    const type = event.currentTarget.dataset.type

    const ofField = field.of.find(it => it.type === type)
    const addItemValue = this.context.formBuilder.createFieldValue(undefined, ofField)

    const nextState = value.state
      .transform()
      .insertBlock({
        type: type,
        isVoid: true,
        data: {
          value: addItemValue
        }
      })
      .apply()

    onChange({patch: {localState: nextState}})
  }

  handleEditorChange = nextState => {
    this.props.onChange({patch: {localState: nextState}})
  }

  renderInsertMenu() {
    const {field} = this.props
    return (
      <div>
        {field.of
          .filter(ofField => ofField.type !== 'paragraph')
          .map(ofField => {
            return (
              <button
                type="button"
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

  render() {
    const {validation, value} = this.props
    const hasError = validation && validation.messages && validation.messages.length > 0
    return (
      <div className={hasError ? styles.error : styles.root}>
        {this.renderInsertMenu()}
        <Editor
          className={styles.input}
          onChange={this.handleEditorChange}
          placeholder=""
          state={value.state}
          plugins={this.slatePlugins}
          schema={this.slateSchema}
        />
      </div>
    )
  }
}
