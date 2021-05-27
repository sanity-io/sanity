/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/no-unassigned-import */
import React from 'react'
import classNames from 'classnames'
import codemirror from 'codemirror'
import {UnControlled as ReactCodeMirror} from 'react-codemirror2'
import isPlainObject from '../util/isPlainObject'
import tryParseParams from '../util/tryParseParams'

require('codemirror/mode/javascript/javascript')
require('codemirror/addon/hint/show-hint')
require('codemirror/addon/edit/closebrackets')

export interface ParamsEditorProps {
  className?: string
  classNameInvalid?: string
  onExecute: () => void
  onChange: (params: {parsed: Record<string, unknown>; raw: string}) => void
  value?: string
  height?: number
}

export interface ParamsEditorState {
  valid: boolean
}

class ParamsEditor extends React.PureComponent<ParamsEditorProps, ParamsEditorState> {
  static defaultProps = {
    value: '{\n  \n}',
    height: 100,
  }

  constructor(props: ParamsEditorProps) {
    super(props)
    this.state = {valid: true}
    this.handleChange = this.handleChange.bind(this)
  }

  handleChange(editor: codemirror.Editor, data: codemirror.EditorChange, value: string) {
    const params = tryParseParams(value)

    this.setState({valid: isPlainObject(params)})

    this.props.onChange({parsed: params, raw: value})
  }

  render() {
    const {
      className = 'vision_params-editor',
      classNameInvalid = 'vision_params-editor-invalid',
      value,
    } = this.props

    const options = {
      lineNumbers: true,
      tabSize: 2,
      mode: {name: 'javascript', json: true},
      autoCloseBrackets: true,
    }

    return (
      <ReactCodeMirror
        className={classNames(className, {[classNameInvalid]: !this.state.valid})}
        value={value}
        onChange={this.handleChange}
        options={options}
        autoCursor={false}
        autoScroll
      />
    )
  }
}

export default ParamsEditor
