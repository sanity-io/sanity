import React, {PureComponent} from 'react'
import PropTypes from 'prop-types'
import AceEditor from 'react-ace'
import {get, has} from 'lodash'
import {PatchEvent, set, insert, unset, setIfMissing} from 'part:@sanity/form-builder/patch-event'
import styles from './CodeInput.css'
import FormField from 'part:@sanity/components/formfields/default'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import DefaultSelect from 'part:@sanity/components/selects/default'
import TextInput from 'part:@sanity/components/textinputs/default'
import createHighlightMarkers from './createHighlightMarkers'
import {
  LANGUAGE_ALIASES,
  ACE_EDITOR_PROPS,
  ACE_SET_OPTIONS,
  SUPPORTED_LANGUAGES,
  SUPPORTED_THEMES,
  DEFAULT_THEME
} from './config'

/* eslint-disable import/no-unassigned-import */
// NOTE: MAKE SURE THESE ALIGN WITH SUPPORTED_LANGUAGES
import 'brace/mode/batchfile'
import 'brace/mode/css'
import 'brace/mode/html'
import 'brace/mode/javascript'
import 'brace/mode/json'
import 'brace/mode/jsx'
import 'brace/mode/markdown'
import 'brace/mode/php'
import 'brace/mode/sass'
import 'brace/mode/scss'
import 'brace/mode/python'
import 'brace/mode/sh'
import 'brace/mode/text'

import 'brace/theme/github'
import 'brace/theme/monokai'
import 'brace/theme/terminal'
import 'brace/theme/tomorrow'
/* eslint-enable import/no-unassigned-import */

function compareNumbers(numA, numB) {
  return numA - numB
}

// Returns a string with the mode name if supported (because aliases), otherwise false
function isSupportedLanguage(mode) {
  const alias = LANGUAGE_ALIASES[mode]
  if (alias) {
    return alias
  }

  const isSupported = SUPPORTED_LANGUAGES.find(lang => lang.value === mode)
  if (isSupported) {
    return mode
  }

  return false
}

export default class CodeInput extends PureComponent {
  static propTypes = {
    level: PropTypes.number.isRequired,
    value: PropTypes.shape({
      _type: PropTypes.string,
      code: PropTypes.string,
      filename: PropTypes.string,
      language: PropTypes.string,
      highlightedLines: PropTypes.array
    }),
    type: PropTypes.shape({
      name: PropTypes.string,
      title: PropTypes.string,
      description: PropTypes.string,
      fields: PropTypes.arrayOf(
        PropTypes.shape({
          name: PropTypes.string.isRequired
        })
      )
    }).isRequired,
    onChange: PropTypes.func
  }

  static defaultProps = {
    onChange() {}
  }

  focus() {
    this.editor.focus()
  }

  componentWillUnmount() {
    this.editor.removeListener('guttermousedown', this.handleGutterMouseDown)
  }

  handleCodeChange = code => {
    const {type, onChange} = this.props
    const path = ['code']
    const fixedLanguage = get(type, 'options.language')

    onChange(
      PatchEvent.from([
        setIfMissing({_type: type.name, language: fixedLanguage}),
        code ? set(code, path) : unset(path)
      ])
    )
  }

  handleToggleSelectLine = lineNumber => {
    const {type, onChange, value} = this.props
    const path = ['highlightedLines']
    const highlightedLines = (value && value.highlightedLines) || []

    let position = highlightedLines.indexOf(lineNumber)
    const patches = [setIfMissing({_type: type.name}), setIfMissing([], ['highlightedLines'])]
    const addLine = position === -1

    if (addLine) {
      // New element, figure out where to add it so it sorts correctly
      const sorted = highlightedLines.concat(lineNumber).sort(compareNumbers)
      position = sorted.indexOf(lineNumber)
      patches.push(
        insert([lineNumber], 'before', path.concat(position === sorted.length - 1 ? -1 : position))
      )
    } else if (highlightedLines.length === 1) {
      // Last element removed, unset whole path
      patches.push(unset(path))

      // Temporary workaround for bug in react-ace
      // (https://github.com/securingsincity/react-ace/issues/229)
      const editor = this.editor

      // Remove all markers from editor
      ;[true, false].forEach(inFront => {
        const currentMarkers = editor.getSession().getMarkers(inFront)
        Object.keys(currentMarkers).forEach(marker => {
          editor.getSession().removeMarker(currentMarkers[marker].id)
        })
      })
    } else {
      // Removed, but not the last element, remove single item
      patches.push(unset(path.concat(position)))
    }

    onChange(PatchEvent.from(patches))
  }

  handleGutterMouseDown = event => {
    const target = event.domEvent.target
    if (target.classList.contains('ace_gutter-cell')) {
      const row = event.getDocumentPosition().row
      this.handleToggleSelectLine(row + 1) // Ace starts at row 0
    }
  }

  handleEditorLoad = editor => {
    this.editor = editor
    this.editor.focus()
    this.editor.on('guttermousedown', this.handleGutterMouseDown)
  }

  handleLanguageChange = item => {
    const {type, onChange} = this.props
    const path = ['language']
    onChange(
      PatchEvent.from([
        setIfMissing({_type: type.name}),
        item ? set(item.value, path) : unset(path)
      ])
    )
  }

  handleFilenameChange = item => {
    const {type, onChange} = this.props
    const path = ['filename']

    onChange(
      PatchEvent.from([
        setIfMissing({_type: type.name}),
        item ? set(item.target.value, path) : unset(path)
      ])
    )
  }

  getLanguageAlternatives() {
    const languageAlternatives = get(this.props.type, 'options.languageAlternatives')
    if (!languageAlternatives) {
      return SUPPORTED_LANGUAGES
    }

    if (!Array.isArray(languageAlternatives)) {
      throw new Error(
        `'options.languageAlternatives' should be an array, got ${typeof languageAlternatives}`
      )
    }

    return languageAlternatives.reduce((acc, {title, value}) => {
      const alias = LANGUAGE_ALIASES[value]
      if (alias) {
        // eslint-disable-next-line no-console
        console.warn(
          `'options.languageAlternatives' lists a language with value "%s", which is an alias of "%s" - please replace the value to read "%s"`,
          value,
          alias,
          alias
        )

        return acc.concat({title, value: alias})
      }

      if (!SUPPORTED_LANGUAGES.find(lang => lang.value === value)) {
        // eslint-disable-next-line no-console
        console.warn(
          `'options.languageAlternatives' lists a language which is not supported: "%s", ignoring it.`,
          value
        )
        return acc
      }

      return acc.concat({title, value})
    }, [])
  }

  getTheme() {
    const preferredTheme = get(this.props.type, 'options.theme')
    return preferredTheme && SUPPORTED_THEMES.find(theme => theme === preferredTheme)
      ? preferredTheme
      : DEFAULT_THEME
  }

  renderEditor = () => {
    const {value, type} = this.props
    const fixedLanguage = get(type, 'options.language')
    const language = isSupportedLanguage((value && value.language) || fixedLanguage) || 'text'
    return (
      <AceEditor
        className={styles.aceEditor}
        mode={language}
        theme={this.getTheme()}
        width="100%"
        onChange={this.handleCodeChange}
        name={`${this._inputId}__aceEditor`}
        value={(value && value.code) || ''}
        markers={
          value && value.highlightedLines ? createHighlightMarkers(value.highlightedLines) : null
        }
        onLoad={this.handleEditorLoad}
        tabSize={2}
        setOptions={ACE_SET_OPTIONS}
        editorProps={ACE_EDITOR_PROPS}
      />
    )
  }

  render() {
    const {value, type, level} = this.props
    const languages = this.getLanguageAlternatives().slice()

    if (has(type, 'options.language')) {
      return (
        <Fieldset legend={type.title} description={type.description} level={level}>
          {this.renderEditor()}
        </Fieldset>
      )
    }

    const isSupported = isSupportedLanguage(value && value.language)
    const selectedLanguage =
      value && value.language ? languages.find(item => item.value === isSupported) : undefined

    if (!selectedLanguage) {
      languages.unshift({title: 'Select language'})
    }

    const languageField = type.fields.find(field => field.name === 'language')
    const filenameField = type.fields.find(field => field.name === 'filename')

    return (
      <Fieldset legend={type.title} description={type.description} level={level}>
        <FormField level={level + 1} label={languageField.type.title}>
          <DefaultSelect
            onChange={this.handleLanguageChange}
            value={selectedLanguage}
            items={languages}
          />
        </FormField>
        {get(type, 'options.withFilename', false) && (
          <FormField label={filenameField.title || 'Filename'} level={level + 1}>
            <TextInput
              type="text"
              name="filename"
              value={value.filename}
              placeholder={filenameField.placeholder}
              onChange={this.handleFilenameChange}
            />
          </FormField>
        )}
        <FormField label={(selectedLanguage && selectedLanguage.title) || 'Code'} level={level + 1}>
          {this.renderEditor()}
        </FormField>
      </Fieldset>
    )
  }
}
