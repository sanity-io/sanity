import React, {PropTypes} from 'react'
import SlateValueContainer from './SlateValueContainer'
import {Editor} from 'slate'
import FormBuilderSlatePlugin from './FormBuilderSlatePlugin'
import {bindAll} from 'lodash'
// import CorePlugin from 'slate/dist/plugins/core'
// import EditBlock from './EditBlock'
// import createProseMirrorSchema from './createProseMirrorSchema'
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
    schema: PropTypes.object,
    resolveInputComponent: PropTypes.func,
    resolvePreviewComponent: PropTypes.func
  }

  constructor(props, context) {
    super(props, context)

    bindAll(this, [
      'handlePatch'
    ])
    this.corePlugin = FormBuilderSlatePlugin({onPatch: this.handlePatch})
  }

  componentDidMount() {

  }

  componentWillUnmount() {
  }

  handlePatch(patch) {
    this.props.onChange({patch: patch})
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

  render() {
    const {validation, value} = this.props
    const hasError = validation && validation.messages && validation.messages.length > 0
    return (
      <div className={hasError ? styles.error : styles.root}>
        {this.renderInsertMenu()}
        <Editor
          placeholder=""
          state={value.state}
          renderNode={this.renderNode}
          renderMark={this.renderMark}
          {...this.corePlugin}
        />
      </div>
    )
  }
}
