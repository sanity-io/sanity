import React, {PropTypes} from 'react'
import {Editor} from 'slate'
import {isEqual, pick} from 'lodash'
import InsertBlockOnEnter from 'slate-insert-block-on-enter'

import DefaultButton from 'part:@sanity/components/buttons/default'

import prepareSlateSchema from './util/prepareSlateSchema'
import styles from './styles/BlockEditor.css'

import SlateValueContainer from './SlateValueContainer'

import FormBuilderNodeOnDrop from './plugins/FormBuilderNodeOnDrop'
import FormBuilderNodeOnPaste from './plugins/FormBuilderNodeOnPaste'
import TextFormattingOnKeyDown from './plugins/TextFormattingOnKeyDown'
import ListItemOnEnterKey from './plugins/ListItemOnEnterKey'
import TextBlockOnEnterKey from './plugins/TextBlockOnEnterKey'

import Toolbar from './toolbar/Toolbar'

import {
  SLATE_DEFAULT_NODE,
  SLATE_BLOCK_FORMATTING_OPTION_KEYS,
  SLATE_LIST_BLOCKS,
  SLATE_LIST_ITEM_TYPE
} from './constants'


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

    const slateSchema = prepareSlateSchema(this.props.field)
    this.slateSchema = slateSchema.schema
    this.groupedFields = slateSchema.fields
    this.slatePlugins = [
      InsertBlockOnEnter({kind: 'block', type: 'paragraph', nodes: [{kind: 'text', text: '', ranges: []}]}),
      FormBuilderNodeOnDrop(),
      FormBuilderNodeOnPaste(this.context.formBuilder, this.props.field.of),
      TextFormattingOnKeyDown(),
      ListItemOnEnterKey(),
      TextBlockOnEnterKey()
    ]

    this.state = {
      fullscreen: false
    }
  }

  handleInsertBlock = item => {
    const {value, onChange, field} = this.props

    const type = item.type
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

  handleToggleFullscreen = () => {
    this.setState({
      fullscreen: !this.state.fullscreen
    })
  }

  handleEditorChange = nextState => {
    this.props.onChange({patch: {localState: nextState}})
  }

  render() {
    const {validation, value, onChange} = this.props
    const hasError = validation && validation.messages && validation.messages.length > 0
    return (
      <div
        className={`
          ${hasError ? styles.error : styles.root}
          ${this.state.fullscreen && styles.fullscreen}
        `}
      >
        <Toolbar
          className={styles.toolbar}
          groupedFields={this.groupedFields}
          onInsertBlock={this.handleInsertBlock}
          value={value}
          onChange={onChange}
          slateSchema={this.slateSchema}
          onFullscreenEnable={this.handleToggleFullscreen}
          fullscreen={this.state.fullscreen}
        />
        <div className={styles.inputContainer}>
          <Editor
            className={styles.input}
            onChange={this.handleEditorChange}
            placeholder=""
            state={value.state}
            plugins={this.slatePlugins}
            schema={this.slateSchema}
          />
        </div>
      </div>
    )
  }
}
