/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/no-unassigned-import */
import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import {UnControlled as ReactCodeMirror} from 'react-codemirror2'
import isPlainObject from '../util/isPlainObject'
import tryParseParams from '../util/tryParseParams'

require('codemirror/mode/javascript/javascript')
require('codemirror/addon/hint/show-hint')
require('codemirror/addon/edit/closebrackets')

const ENTER_KEY = 13

class ParamsEditor extends React.PureComponent {
  constructor(props) {
    super(props)
    this.state = {valid: true}
    this.handleChange = this.handleChange.bind(this)
    this.handleKeyUp = this.handleKeyUp.bind(this)
  }

  handleKeyUp(evt) {
    if ((evt.ctrlKey || evt.metaKey) && evt.which === ENTER_KEY) {
      this.props.onExecute()
    }
  }

  handleChange(editor, metadata, value) {
    const params = tryParseParams(value)
    this.setState({valid: isPlainObject(params)})
    this.props.onChange({parsed: params, raw: value})
  }

  render() {
    const {className, classNameInvalid} = this.props
    const options = {
      lineNumbers: true,
      tabSize: 2,
      mode: {name: 'javascript', json: true},
      autoCloseBrackets: true,
    }
    return (
      <ReactCodeMirror
        className={classNames(className, {[classNameInvalid]: !this.state.valid})}
        value={this.props.value}
        onChange={this.handleChange}
        options={options}
        autoCursor={false}
        autoScroll
      />
    )
  }
}

ParamsEditor.propTypes = {
  className: PropTypes.string,
  classNameInvalid: PropTypes.string,
  onExecute: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
  height: PropTypes.number,
}

ParamsEditor.defaultProps = {
  value: '{\n  \n}',
  className: 'vision_params-editor',
  classNameInvalid: 'vision_params-editor-invalid',
  height: 100,
}

export default ParamsEditor
