import React, {useCallback, useEffect, useImperativeHandle, useRef} from 'react'
import {FormFieldPresence} from '@sanity/base/presence'
import {FormField, FormFieldSet} from '@sanity/base/components'
import {Path, Marker} from '@sanity/types'
import {Card, Select, TextInput} from '@sanity/ui'
import * as PathUtils from '@sanity/util/paths'
import {ChangeIndicatorProvider} from '@sanity/base/change-indicators'
import {PatchEvent, set, unset, setIfMissing} from 'part:@sanity/form-builder/patch-event'
import AceEditor from 'react-ace'
import {get, has} from 'lodash'
import styled from 'styled-components'
import {useId} from '@reach/auto-id'
import createHighlightMarkers, {highlightMarkersCSS} from './createHighlightMarkers'
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

const EditorContainer = styled(Card)`
  position: relative;
  box-sizing: border-box;
  overflow: hidden;
  z-index: 0;

  .ace_editor {
    font-family: ${({theme}) => theme.sanity.fonts.code.family};
    font-size: ${({theme}) => theme.sanity.fonts.code.sizes[1]};
    line-height: inherit;
  }

  ${highlightMarkersCSS}

  &:not([disabled]):not([readonly]) {
    &:focus,
    &:focus-within {
      box-shadow: 0 0 0 2px ${({theme}) => theme.sanity.color.base.focusRing};
      background-color: ${({theme}) => theme.sanity.color.base.bg};
      border-color: ${({theme}) => theme.sanity.color.base.focusRing};
    }
  }
`

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

const CodeInput = React.forwardRef(
  (props: CodeInputProps, ref: React.ForwardedRef<{focus: () => void}>) => {
    const aceEditorRef = useRef<any>()
    const aceEditorId = useId()

    const {
      onFocus,
      onChange,
      onBlur,
      compareValue,
      value,
      presence,
      type,
      level,
      readOnly,
      focusPath,
    } = props

    useImperativeHandle(ref, () => ({
      focus: () => {
        aceEditorRef?.current?.editor?.focus()
      },
    }))

    const handleLanguageFocus = useCallback(() => {
      onFocus(PATH_LANGUAGE)
    }, [onFocus])

    const handleCodeFocus = useCallback(() => {
      onFocus(PATH_CODE)
    }, [onFocus])

    const handleFilenameFocus = useCallback(() => {
      onFocus(PATH_FILENAME)
    }, [onFocus])

    const handleFilenameChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const val = event.target.value
        const path = PATH_FILENAME

        onChange(
          PatchEvent.from([setIfMissing({_type: type.name}), val ? set(val, path) : unset(path)])
        )
      },
      [onChange, type.name]
    )

    const getTheme = useCallback(() => {
      const preferredTheme = get(type, 'options.theme')
      return preferredTheme && SUPPORTED_THEMES.find((theme) => theme === preferredTheme)
        ? preferredTheme
        : DEFAULT_THEME
    }, [type])

    const handleToggleSelectLine = useCallback(
      (lineNumber: number) => {
        const editorSession = aceEditorRef.current?.editor?.getSession()
        const backgroundMarkers = editorSession?.getMarkers(true)
        const currentHighlightedLines = Object.keys(backgroundMarkers)
          .filter((key) => backgroundMarkers[key].type === 'highlight')
          .map((key) => backgroundMarkers[key].range.start.row)
        const currentIndex = currentHighlightedLines.indexOf(lineNumber)
        if (currentIndex > -1) {
          // toggle remove
          currentHighlightedLines.splice(currentIndex, 1)
        } else {
          // toggle add
          currentHighlightedLines.push(lineNumber)
          currentHighlightedLines.sort()
        }
        onChange(
          PatchEvent.from(
            set(
              currentHighlightedLines.map(
                (line) =>
                  // ace starts at line (row) 0, but we store it starting at line 1
                  line + 1
              ),
              ['highlightedLines']
            )
          )
        )
      },
      [aceEditorRef, onChange]
    )

    const handleGutterMouseDown = useCallback(
      (event: any) => {
        const target = event.domEvent.target
        if (target.classList.contains('ace_gutter-cell')) {
          const row = event.getDocumentPosition().row
          handleToggleSelectLine(row)
        }
      },
      [handleToggleSelectLine]
    )

    useEffect(() => {
      const editor = aceEditorRef?.current?.editor
      return () => {
        editor?.session?.removeListener('guttermousedown', handleGutterMouseDown)
      }
    }, [aceEditorRef, handleGutterMouseDown])

    const handleEditorLoad = useCallback(
      (editor: any) => {
        editor?.on('guttermousedown', handleGutterMouseDown)
      },
      [handleGutterMouseDown]
    )

    const getLanguageAlternatives = useCallback((): {
      title: string
      value: string
    }[] => {
      const languageAlternatives = get(type, 'options.languageAlternatives')
      if (!languageAlternatives) {
        return SUPPORTED_LANGUAGES
      }

      if (!Array.isArray(languageAlternatives)) {
        throw new Error(
          `'options.languageAlternatives' should be an array, got ${typeof languageAlternatives}`
        )
      }

      return languageAlternatives.reduce((acc, {title, value: val}) => {
        const alias = LANGUAGE_ALIASES[val]
        if (alias) {
          // eslint-disable-next-line no-console
          console.warn(
            `'options.languageAlternatives' lists a language with value "%s", which is an alias of "%s" - please replace the value to read "%s"`,
            val,
            alias,
            alias
          )

          return acc.concat({title, value: alias})
        }

        if (!SUPPORTED_LANGUAGES.find((lang) => lang.value === val)) {
          // eslint-disable-next-line no-console
          console.warn(
            `'options.languageAlternatives' lists a language which is not supported: "%s", syntax highlighting will be disabled.`,
            val
          )
        }

        return acc.concat({title, value: val})
      }, [])
    }, [type])

    const handleCodeChange = useCallback(
      (code: string) => {
        const path = PATH_CODE
        const fixedLanguage = get(type, 'options.language')

        onChange(
          PatchEvent.from([
            setIfMissing({_type: type.name, language: fixedLanguage}),
            code ? set(code, path) : unset(path),
          ])
        )
      },
      [onChange, type]
    )

    const handleLanguageChange = useCallback(
      (event: React.ChangeEvent<HTMLSelectElement>) => {
        const val = event.currentTarget.value
        const path = PATH_LANGUAGE

        onChange(
          PatchEvent.from([setIfMissing({_type: type.name}), val ? set(val, path) : unset(path)])
        )
      },
      [onChange, type.name]
    )

    const languages = getLanguageAlternatives().slice()

    const selectedLanguage = props?.value?.language
      ? languages.find((item: {value: string | undefined}) => item.value === props?.value?.language)
      : undefined

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

    const renderEditor = useCallback(() => {
      const fixedLanguage = get(type, 'options.language')
      const mode = isSupportedLanguage((value && value.language) || fixedLanguage) || 'text'

      return (
        <EditorContainer radius={1} shadow={1} readOnly={readOnly}>
          <AceEditor
            ref={aceEditorRef}
            mode={mode}
            theme={getTheme()}
            width="100%"
            onChange={handleCodeChange}
            name={`editor-${aceEditorId}`}
            value={(value && value.code) || ''}
            markers={
              value && value.highlightedLines
                ? createHighlightMarkers(value.highlightedLines)
                : undefined
            }
            onLoad={handleEditorLoad}
            readOnly={readOnly}
            tabSize={2}
            wrapEnabled
            setOptions={ACE_SET_OPTIONS}
            editorProps={ACE_EDITOR_PROPS}
            onFocus={handleCodeFocus}
            onBlur={onBlur}
          />
        </EditorContainer>
      )
    }, [
      type,
      value,
      readOnly,
      getTheme,
      handleCodeChange,
      aceEditorId,
      handleEditorLoad,
      handleCodeFocus,
      onBlur,
    ])

    if (has(type, 'options.language')) {
      return (
        <ChangeIndicatorProvider
          path={PATH_CODE}
          focusPath={focusPath}
          value={value?.code}
          compareValue={codeCompareValue}
        >
          <FormFieldSet title={type.title} description={type.description} level={level}>
            {renderEditor()}
          </FormFieldSet>
        </ChangeIndicatorProvider>
      )
    }

    return (
      <FormFieldSet
        title={type.title}
        description={type.description}
        level={level}
        __unstable_changeIndicator={false}
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
            __unstable_presence={languagePresence}
          >
            <Select
              onChange={handleLanguageChange}
              readOnly={readOnly}
              value={selectedLanguage?.value || ''}
              onFocus={handleLanguageFocus}
              onBlur={onBlur}
            >
              {languages.map((lang: {title: string; value: string}) => (
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
              __unstable_presence={filenamePresence}
            >
              <TextInput
                name="filename"
                value={value?.filename || ''}
                placeholder={filenameField?.placeholder}
                onChange={handleFilenameChange}
                onFocus={handleFilenameFocus}
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
          <FormField label="Code" level={level + 1} __unstable_presence={codePresence}>
            {renderEditor()}
          </FormField>
        </ChangeIndicatorProvider>
      </FormFieldSet>
    )
  }
)

CodeInput.displayName = 'CodeInput'

export default CodeInput
