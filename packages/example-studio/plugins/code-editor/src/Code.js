import PropTypes from 'prop-types'
// @flow weak
import React from 'react'
import FormField from 'part:@sanity/components/formfields/default'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import DefaultSelect from 'part:@sanity/components/selects/default'
import {uniqueId} from 'lodash'
import PatchEvent, {set, unset} from '@sanity/form-builder/PatchEvent'
import AceEditor from 'react-ace'
import {get} from 'lodash'
import fieldsetStyles from './Fieldset.css'

import 'brace/mode/text'
import 'brace/mode/javascript'
import 'brace/mode/jsx'
import 'brace/mode/markdown'
import 'brace/mode/css'
import 'brace/mode/html'

import 'brace/theme/tomorrow'

const modes = [
  {title: 'JSX', value: 'jsx'},
  {title: 'JavaScript', value: 'javascript'},
  {title: 'Markdown', value: 'markdown'},
  {title: 'CSS', value: 'css'},
  {title: 'HTML', value: 'html'},
  {title: 'text', value: 'text'}
]

export default class Code extends React.PureComponent {

  static propTypes = {
    type: PropTypes.object,
    level: PropTypes.number.isRequired,
    value: PropTypes.shape({
      code: PropTypes.string,
      mode: PropTypes.string
    }),
    onChange: PropTypes.func
  }

  static defaultProps = {
    value: '',
    onChange() {}
  }

  state = {
    hasFocus: false
  }

  _inputId = uniqueId('Text')

  handleCodeChange = code => {
    const {value} = this.props
    const newValue = Object.assign({}, value)
    newValue.code = code
    if (!value.mode) {
      newValue.mode = modes[0].value
    }
    this.props.onChange(PatchEvent.from(code ? set(newValue) : unset()))
  }

  handleModeChange = item => {
    const {value} = this.props
    const newValue = Object.assign({}, value)
    newValue.mode = item.value
    this.props.onChange(PatchEvent.from(item.value ? set(newValue) : unset()))
  }

  renderEditor = (editorTitle, level, type, mode, value) => {
    return (

      <AceEditor
        mode={mode}
        theme="tomorrow"
        width="100%"
        onChange={this.handleCodeChange}
        name={`${this._inputId}__aceEditor`}
        value={value.code || ''}
        editorProps={{$blockScrolling: true}}
      />

    )
  }

  render() {
    const {value, type, level} = this.props
    const mode = value.mode || get(type, 'options.mode') || modes[0].value

    const currentMode = modes.find(item => item.value === value.mode) || modes[0]

    const modeTitle = type.fields.find(field => field.name === 'mode').type.title
    const editorTitle = type.fields.find(field => field.name === 'code').type.title

    if (get(type, 'options.mode')) {
      return (
        <Fieldset styles={fieldsetStyles} legend={type.title} description={type.description}>
          {
            this.renderEditor(type.title, level, type, mode, value)
          }
        </Fieldset>
      )
    }

    return (
      <Fieldset legend={type.title} description={type.description}>
        <DefaultSelect
          label={modeTitle}
          onChange={this.handleModeChange}
          value={currentMode}
          items={modes}
          level={level + 1}
        />
        <FormField label={editorTitle} level={level + 1}>
          {
            this.renderEditor(editorTitle, level, type, mode, value)
          }
        </FormField>
      </Fieldset>
    )
  }
}
