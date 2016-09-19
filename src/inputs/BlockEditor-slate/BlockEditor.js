import React, {PropTypes} from 'react'
import SlateValueContainer from './SlateValueContainer'
import {Editor} from 'slate'
import mapToObject from './util/mapToObject'
import createPreviewNode from './createFormBuilderPreviewNode'
import styles from './styles/BlockEditor.css'

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

    this.slateNodes = mapToObject(this.props.field.of.filter(ofType => ofType.type !== 'paragraph'), ofField => {
      return [ofField.type, createPreviewNode(ofField)]
    })
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

  handleDrop = (event, data, state, editor) => {
    switch (data.type) {
      case 'node': console.log('DROP', data)
      default: return undefined
    }
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
          schema={{nodes: this.slateNodes}}
        />
      </div>
    )
  }
}
