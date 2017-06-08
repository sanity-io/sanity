import PropTypes from 'prop-types'
import React from 'react'
import FormField from 'part:@sanity/components/formfields/default'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import DefaultSelect from 'part:@sanity/components/selects/default'
import PatchEvent, {set, unset, setIfMissing} from '@sanity/form-builder/PatchEvent'
import AceEditor from 'react-ace'
import {get, has, xor} from 'lodash'
import fieldsetStyles from './Fieldset.css'
import styles from './Styles.css'

import 'brace/mode/text'
import 'brace/mode/javascript'
import 'brace/mode/jsx'
import 'brace/mode/markdown'
import 'brace/mode/css'
import 'brace/mode/html'

import 'brace/theme/tomorrow'

function compareNumbers(a, b) { // eslint-disable-line id-length
  return a - b
}

const SUPPORTED_LANGUAGES = [
  {title: 'JSX', value: 'jsx'},
  {title: 'JavaScript', value: 'javascript'},
  {title: 'Markdown', value: 'markdown'},
  {title: 'CSS', value: 'css'},
  {title: 'HTML', value: 'html'},
  {title: 'text', value: 'text'}
]

class CodeInput extends React.Component {

  static propTypes = {
    type: PropTypes.object,
    level: PropTypes.number.isRequired,
    value: PropTypes.shape({
      _type: PropTypes.string,
      code: PropTypes.string,
      language: PropTypes.string,
      highlightedLines: PropTypes.array
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


  handleCodeChange = code => {
    const {type, onChange} = this.props
    const path = ['code']

    const fixedLanguage = get(type, 'options.language')

    onChange(PatchEvent.from([
      setIfMissing({_type: type.name, language: fixedLanguage}),
      code ? set(code, path) : unset(path)
    ]))
  }

  handleToggleSelectLine = line => {
    const {type, onChange} = this.props
    const path = ['highlightedLines']

    const highlightedLines = xor(this.props.value.highlightedLines, [line]).sort(compareNumbers)

    onChange(PatchEvent.from([
      setIfMissing({_type: type.name, highlightedLines: []}),
      line ? set(highlightedLines, path) : unset(path)
    ]))

  }

  handleEditorLoad = editor => {
    editor.focus()
    editor.on('guttermousedown', event => {
      const target = event.domEvent.target
      if (target.className.indexOf('ace_gutter-cell') == -1) {
        return
      }
      const row = event.getDocumentPosition().row
      this.handleToggleSelectLine(`${row}`)
    })
  }

  handleLanguageChange = item => {
    const {type, onChange} = this.props
    const path = ['language']
    onChange(PatchEvent.from([
      setIfMissing({_type: type.name}),
      item ? set(item.value, path) : unset(path)
    ]))
  }

  createMarkers = rows => {
    const markers = rows.map(row => {
      return {
        startRow: Number(row),
        startCol: 0,
        endRow: Number(row),
        endCol: 500,
        className: styles.highlight,
        type: 'background',
        inFront: true
      }
    })
    return markers
  }

  renderEditor = () => {
    const {value, type} = this.props
    const fixedLanguage = get(type, 'options.language')
    return (
      <AceEditor
        mode={value.language || fixedLanguage || 'text'}
        theme="tomorrow"
        width="100%"
        onChange={this.handleCodeChange}
        name={`${this._inputId}__aceEditor`}
        value={value.code || ''}
        markers={value.highlightedLines ? this.createMarkers(value.highlightedLines) : null}
        onLoad={this.handleEditorLoad}
        editorProps={{
          $blockScrolling: true,
        }}
      />

    )
  }

  render() {
    const {value, type, level} = this.props

    if (has(type, 'options.language')) {
      return (
        <Fieldset styles={fieldsetStyles} legend={type.title} description={type.description}>
          {
            this.renderEditor()
          }
        </Fieldset>
      )
    }

    const currentLanguage = (value && value.language) ? SUPPORTED_LANGUAGES.find(item => item.value === value.language) : null

    const languageField = type.fields.find(field => field.name === 'language')
    const languages = currentLanguage ? SUPPORTED_LANGUAGES : [{title: 'Select language'}].concat(SUPPORTED_LANGUAGES)

    return (
      <Fieldset legend={type.title} description={type.description}>
        <DefaultSelect
          label={languageField.type.title}
          onChange={this.handleLanguageChange}
          value={currentLanguage}
          items={languages}
          level={level + 1}
        />
        <FormField label={type.title} level={level + 1}>
          {
            this.renderEditor()
          }
        </FormField>
      </Fieldset>
    )
  }
}

export default CodeInput
