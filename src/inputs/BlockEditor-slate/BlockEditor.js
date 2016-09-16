import React, {PropTypes} from 'react'
import SlateValueContainer from './SlateValueContainer'
import {Editor} from 'slate'
import Video from './tmp/Video'
import {bindAll} from 'lodash'
import mapToObject from './util/mapToObject'
import createPreviewNode from './createFormBuilderPreviewNode'

// import CorePlugin from 'slate/dist/plugins/core'
// import EditBlock from './EditBlock'
// import createSlateSchema from './createSlateSchema'
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

    bindAll(this, [
      'handleEditorChange',
      'handleInsertBlock'
    ])

    this.slateNodes = mapToObject(this.props.field.of.filter(ofType => ofType.type !== 'paragraph'), ofField => {
      return [ofField.type, createPreviewNode(ofField)]
    })
    this.slateNodes.video = Video
  }

  componentDidMount() {
  }

  componentWillUnmount() {
  }

  handleInsertBlock(event) {
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

  handleEditorChange(nextState) {
    this.props.onChange({patch: {localState: nextState}})
  }

  insertVideo = () => {
    const {value, onChange} = this.props
    const addItemValue = this.context.formBuilder.createFieldValue(undefined, {type: 'video'})

    const nextState = value.state
      .transform()
      .insertBlock({
        type: 'video',
        isVoid: true,
        data: {
          value: addItemValue
        }
      })
      .apply()
    onChange({patch: {localState: nextState}})
  }
  renderInsertMenu() {
    const {field} = this.props
    return (
      <div>
        <button type="button" onClick={this.insertVideo}>Insert video</button>
        {field.of
          .filter(ofField => ofField.type !== 'paragraph')
          .map(ofField => {
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

  render() {
    const {validation, value} = this.props
    const hasError = validation && validation.messages && validation.messages.length > 0
    return (
      <div className={hasError ? styles.error : styles.root}>
        {this.renderInsertMenu()}
        <Editor
          onChange={this.handleEditorChange}
          placeholder=""
          state={value.state}
          schema={{nodes: this.slateNodes}}
        />
      </div>
    )
  }
}
