/* eslint-disable no-undef, import/no-unresolved */

import {FormFieldPresence} from '@sanity/base/presence'
import {Path, Marker} from '@sanity/types'
import {Select, TextInput} from '@sanity/ui'
import * as PathUtils from '@sanity/util/paths'
import classNames from 'classnames'
import React, {PureComponent} from 'react'
import AceEditor from 'react-ace'
import {get, has} from 'lodash'
import {ChangeIndicatorProvider} from '@sanity/base/lib/change-indicators'
import {PatchEvent, set, insert, unset, setIfMissing} from 'part:@sanity/form-builder/patch-event'
import FormField from 'part:@sanity/components/formfields/default'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import createHighlightMarkers from './createHighlightMarkers'
import styles from './CodeInput.css'
import {CodeInputType, CodeInputValue} from './types'

import {
  LANGUAGE_ALIASES,
  ACE_EDITOR_PROPS,
  ACE_SET_OPTIONS,
  SUPPORTED_LANGUAGES,
  SUPPORTED_THEMES,
  DEFAULT_THEME,
  PATH_LANGUAGE,
  PATH_CODE,
  PATH_FILENAME,
} from './config'

/* eslint-disable import/no-unassigned-import */
// NOTE: MAKE SURE THESE ALIGN WITH SUPPORTED_LANGUAGES
import 'brace/mode/batchfile'
import 'brace/mode/css'
import 'brace/mode/html'
import 'brace/mode/typescript'
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
import './groq'

import 'brace/theme/github'
import 'brace/theme/monokai'
import 'brace/theme/terminal'
import 'brace/theme/tomorrow'
/* eslint-enable import/no-unassigned-import */

export interface CodeInputProps {
  compareValue?: CodeInputValue
  focusPath: Path
  level: number
  markers: Marker[]
  onBlur: () => void
  onChange: (...args: any[]) => void
  onFocus: (path: Path) => void
  presence: FormFieldPresence[]
  readOnly?: boolean
  type: CodeInputType
  value?: CodeInputValue
}

function compareNumbers(numA: number, numB: number) {
  return numA - numB
}

// Returns a string with the mode name if supported (because aliases), otherwise false
function isSupportedLanguage(mode: string) {
  const alias = LANGUAGE_ALIASES[mode]

  if (alias) {
    return alias
  }

  const isSupported = SUPPORTED_LANGUAGES.find((lang) => lang.value === mode)
  if (isSupported) {
    return mode
  }

  return false
}

export default class CodeInput extends PureComponent<CodeInputProps> {
  editor: any = null
  _inputId?: string

  focus() {
    this.editor?.focus()
  }

  componentWillUnmount() {
    this.editor?.removeListener('guttermousedown', this.handleGutterMouseDown)
  }

  handleCodeChange = (code: string) => {
    const {type, onChange} = this.props
    const path = PATH_CODE
    const fixedLanguage = get(type, 'options.language')

    onChange(
      PatchEvent.from([
        setIfMissing({_type: type.name, language: fixedLanguage}),
        code ? set(code, path) : unset(path),
      ])
    )
  }

  handleToggleSelectLine = (lineNumber: number) => {
    const {type, onChange, value} = this.props
    const path: Array<string | number> = ['highlightedLines']
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
      ;[true, false].forEach((inFront) => {
        const editorSession = editor?.getSession()
        const currentMarkers = editorSession.getMarkers(inFront)
        Object.keys(currentMarkers).forEach((marker) => {
          editorSession.removeMarker(currentMarkers[marker].id)
        })
      })
    } else {
      // Removed, but not the last element, remove single item
      patches.push(unset(path.concat(position)))
    }

    onChange(PatchEvent.from(patches))
  }

  handleGutterMouseDown = (event: any) => {
    const target = event.domEvent.target
    if (target.classList.contains('ace_gutter-cell')) {
      const row = event.getDocumentPosition().row
      this.handleToggleSelectLine(row + 1) // Ace starts at row 0
    }
  }

  handleEditorLoad = (editor: any) => {
    this.editor = editor

    editor.focus()
    editor.on('guttermousedown', this.handleGutterMouseDown)
  }

  handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const {type, onChange} = this.props
    const value = event.currentTarget.value
    const path = PATH_LANGUAGE

    onChange(
      PatchEvent.from([setIfMissing({_type: type.name}), value ? set(value, path) : unset(path)])
    )
  }

  handleFilenameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const {type, onChange} = this.props
    const value = event.target.value
    const path = PATH_FILENAME

    onChange(
      PatchEvent.from([setIfMissing({_type: type.name}), value ? set(value, path) : unset(path)])
    )
  }

  getLanguageAlternatives(): {title: string; value: string}[] {
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

      if (!SUPPORTED_LANGUAGES.find((lang) => lang.value === value)) {
        // eslint-disable-next-line no-console
        console.warn(
          `'options.languageAlternatives' lists a language which is not supported: "%s", syntax highlighting will be disabled.`,
          value
        )
      }

      return acc.concat({title, value})
    }, [])
  }

  getTheme() {
    const preferredTheme = get(this.props.type, 'options.theme')
    return preferredTheme && SUPPORTED_THEMES.find((theme) => theme === preferredTheme)
      ? preferredTheme
      : DEFAULT_THEME
  }

  renderEditor = () => {
    const {readOnly, value, type, onBlur} = this.props
    const fixedLanguage = get(type, 'options.language')
    const mode = isSupportedLanguage((value && value.language) || fixedLanguage) || 'text'

    return (
      <div className={classNames(styles.aceEditorContainer, readOnly && styles.readOnly)}>
        <AceEditor
          className={styles.aceEditor}
          mode={mode}
          theme={this.getTheme()}
          width="100%"
          onChange={this.handleCodeChange}
          name={`${this._inputId}__aceEditor`}
          value={(value && value.code) || ''}
          markers={
            value && value.highlightedLines
              ? createHighlightMarkers(value.highlightedLines)
              : undefined
          }
          onLoad={this.handleEditorLoad}
          readOnly={readOnly}
          tabSize={2}
          wrapEnabled
          setOptions={ACE_SET_OPTIONS}
          editorProps={ACE_EDITOR_PROPS}
          onFocus={this.handleCodeFocus}
          onBlur={onBlur}
        />
      </div>
    )
  }

  handleLanguageFocus = () => {
    this.props.onFocus(PATH_LANGUAGE)
  }

  handleCodeFocus = () => {
    this.props.onFocus(PATH_CODE)
  }

  handleFilenameFocus = () => {
    this.props.onFocus(PATH_FILENAME)
  }

  render() {
    const {compareValue, value, type, level, readOnly, presence, onBlur, focusPath} = this.props
    const languages = this.getLanguageAlternatives().slice()

    if (has(type, 'options.language')) {
      const codeCompareValue = PathUtils.get(compareValue, PATH_CODE)
      return (
        <ChangeIndicatorProvider
          path={PATH_CODE}
          focusPath={focusPath}
          value={value?.code}
          compareValue={codeCompareValue}
        >
          <Fieldset legend={type.title} description={type.description} level={level}>
            {this.renderEditor()}
          </Fieldset>
        </ChangeIndicatorProvider>
      )
    }

    const selectedLanguage =
      value && value.language ? languages.find((item) => item.value === value.language) : undefined

    if (!selectedLanguage) {
      languages.unshift({title: 'Select language', value: ''})
    }

    const languageField = type.fields.find((field) => field.name === 'language')
    const filenameField = type.fields.find((field) => field.name === 'filename')

    const languageCompareValue = PathUtils.get(compareValue, PATH_LANGUAGE)
    const codeCompareValue = PathUtils.get(compareValue, PATH_CODE)
    const filenameCompareValue = PathUtils.get(compareValue, PATH_FILENAME)

    const languagePresence = presence.filter((presenceItem) =>
      PathUtils.startsWith(PATH_LANGUAGE, presenceItem.path)
    )
    const codePresence = presence.filter((presenceItem) =>
      PathUtils.startsWith(PATH_CODE, presenceItem.path)
    )

    const filenamePresence = presence.filter((presenceItem) =>
      PathUtils.startsWith(PATH_FILENAME, presenceItem.path)
    )

    return (
      <Fieldset
        legend={type.title}
        description={type.description}
        level={level}
        changeIndicator={false}
      >
        <ChangeIndicatorProvider
          path={PATH_LANGUAGE}
          focusPath={focusPath}
          value={selectedLanguage?.value}
          compareValue={languageCompareValue}
        >
          <FormField
            level={level + 1}
            label={languageField?.title || 'Language'}
            presence={languagePresence}
          >
            <Select
              onChange={this.handleLanguageChange}
              readOnly={readOnly}
              value={selectedLanguage?.value || ''}
              onFocus={this.handleLanguageFocus}
              onBlur={onBlur}
            >
              {languages.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.title}
                </option>
              ))}
            </Select>
          </FormField>
        </ChangeIndicatorProvider>
        {get(type, 'options.withFilename', false) && (
          <ChangeIndicatorProvider
            path={PATH_FILENAME}
            focusPath={focusPath}
            value={value?.filename}
            compareValue={filenameCompareValue}
          >
            <FormField
              label={filenameField?.title || 'Filename'}
              level={level + 1}
              presence={filenamePresence}
            >
              <TextInput
                name="filename"
                value={value?.filename || ''}
                placeholder={filenameField?.placeholder}
                onChange={this.handleFilenameChange}
                onFocus={this.handleFilenameFocus}
                onBlur={onBlur}
              />
            </FormField>
          </ChangeIndicatorProvider>
        )}
        <ChangeIndicatorProvider
          path={PATH_CODE}
          focusPath={focusPath}
          value={value?.code}
          compareValue={codeCompareValue}
        >
          <FormField label="Code" level={level + 1} presence={codePresence}>
            <div className={styles.editorContainer}>{this.renderEditor()}</div>
          </FormField>
        </ChangeIndicatorProvider>
      </Fieldset>
    )
  }
}
