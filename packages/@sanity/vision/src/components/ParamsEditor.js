/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/no-unassigned-import */
import React from 'react'
import classNames from 'classnames'
import {debounce} from 'lodash'
import isPlainObject from '../util/isPlainObject'
import {tryParseParams} from '../util/tryParseParams'
import {ReactCodeMirror} from './ParamsEditor.styled'

const ENTER_KEY = 13
class ParamsEditor extends React.PureComponent {
  constructor(props) {
    super(props)
    this.state = {valid: true}
    this.handleChange = this.handleChange.bind(this)
    this.handleKeyUp = this.handleKeyUp.bind(this)
    this.handleThrottledChange = debounce(this.handleChange, 1000 / 3)
    this.handleThrottledChange = this.handleThrottledChange.bind(this)
  }

  componentDidMount() {
    // Check if value is valid on load
    const params = tryParseParams(this.props.value)
    const validationError = params instanceof Error ? params.message : null
    const valid = isPlainObject(params)
    this.setState({valid})
    this.props.onChange({parsed: params, raw: this.props.value, valid, validationError})
  }

  handleKeyUp(evt) {
    if ((evt.ctrlKey || evt.metaKey) && evt.which === ENTER_KEY) {
      this.props.onExecute()
    }
  }

  handleChange(editor, metadata, value) {
    const params = tryParseParams(value)
    const valid = isPlainObject(params)
    const validationError = params instanceof Error ? params.message : null

    this.setState({valid})
    this.props.onChange({parsed: params, raw: value, valid, validationError})
  }

  render() {
    const {valid} = this.state
    const isNotValid = !valid
    const {className, classNameInvalid} = this.props
    const options = {
      lineNumbers: true,
      tabSize: 2,
      mode: {name: 'javascript', json: true},
      autoCloseBrackets: true,
      extraKeys: {
        Tab: false,
      },
    }
    return (
      <ReactCodeMirror
        $isInvalid={isNotValid}
        className={classNames(className, {[classNameInvalid]: isNotValid})}
        value={this.props.value}
        onChange={this.handleThrottledChange}
        options={options}
        autoCursor={false}
        autoScroll
      />
    )
  }
}

ParamsEditor.defaultProps = {
  value: '{\n  \n}',
  className: 'vision_params-editor',
  classNameInvalid: 'vision_params-editor-invalid',
}

export default ParamsEditor
