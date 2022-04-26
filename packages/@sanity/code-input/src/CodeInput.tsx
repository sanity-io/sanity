import React, {useCallback, useEffect, useImperativeHandle, useMemo, useRef} from 'react'
import {FormField, FormFieldSet, FieldMember} from '@sanity/base/_unstable'
import {FormNode, set, unset, setIfMissing, ObjectInputProps} from '@sanity/base/form'
import {ObjectSchemaType} from '@sanity/types'
import {Card, Select, Stack, TextInput} from '@sanity/ui'
import AceEditor from 'react-ace'
import styled from 'styled-components'
import createHighlightMarkers, {highlightMarkersCSS} from './createHighlightMarkers'
import {CodeInputLanguage, CodeInputValue} from './types'
/* eslint-disable-next-line import/no-unassigned-import */
import './editorSupport'

import {
  ACE_EDITOR_PROPS,
  ACE_SET_OPTIONS,
  DEFAULT_THEME,
  LANGUAGE_ALIASES,
  PATH_CODE,
  PATH_FILENAME,
  PATH_LANGUAGE,
  SUPPORTED_LANGUAGES,
  SUPPORTED_THEMES,
} from './config'

export type {CodeInputLanguage, CodeInputValue} from './types'

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

export type CodeSchemaType = Omit<ObjectSchemaType, 'options'> & {
  options: {
    theme?: string
    languageAlternatives: CodeInputLanguage[]
    language: string
    withFilename?: boolean
  }
}

export type CodeInputProps = ObjectInputProps<CodeInputValue, CodeSchemaType>

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

export function CodeInput(props: CodeInputProps) {
  const {inputProps, members, onChange, renderField, type, value} = props
  const {id, onBlur, onFocus, readOnly, ref} = inputProps
  const aceEditorRef = useRef<any>()

  const fieldMembers = useMemo(
    () => members.filter((member) => member.type === 'field') as FieldMember[],
    [members]
  )

  const languageFieldMember = fieldMembers.find((member) => member.field.name === 'language')
  const filenameMember = fieldMembers.find((member) => member.field.name === 'filename')
  const codeFieldMember = fieldMembers.find((member) => member.field.name === 'code')

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

      onChange(setIfMissing({_type: type.name}), val ? set(val, path) : unset(path))
    },
    [onChange, type.name]
  )

  const getTheme = useCallback(() => {
    const preferredTheme = type.options?.theme
    return preferredTheme && SUPPORTED_THEMES.find((theme) => theme === preferredTheme)
      ? preferredTheme
      : DEFAULT_THEME
  }, [type])

  const handleToggleSelectLine = useCallback(
    (lineNumber: number) => {
      const editorSession = aceEditorRef.current?.editor?.getSession()
      const backgroundMarkers = editorSession?.getMarkers(true)
      const currentHighlightedLines = Object.keys(backgroundMarkers)
        .filter((key) => backgroundMarkers[key].type === 'screenLine')
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
        set(
          currentHighlightedLines.map(
            (line) =>
              // ace starts at line (row) 0, but we store it starting at line 1
              line + 1
          ),
          ['highlightedLines']
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
    mode?: string
  }[] => {
    const languageAlternatives = type.options?.languageAlternatives
    if (!languageAlternatives) {
      return SUPPORTED_LANGUAGES
    }

    if (!Array.isArray(languageAlternatives)) {
      throw new Error(
        `'options.languageAlternatives' should be an array, got ${typeof languageAlternatives}`
      )
    }

    return languageAlternatives.reduce((acc: CodeInputLanguage[], {title, value: val, mode}) => {
      const alias = LANGUAGE_ALIASES[val]
      if (alias) {
        // eslint-disable-next-line no-console
        console.warn(
          `'options.languageAlternatives' lists a language with value "%s", which is an alias of "%s" - please replace the value to read "%s"`,
          val,
          alias,
          alias
        )

        return acc.concat({title, value: alias, mode: mode})
      }

      if (!mode && !SUPPORTED_LANGUAGES.find((lang) => lang.value === val)) {
        // eslint-disable-next-line no-console
        console.warn(
          `'options.languageAlternatives' lists a language which is not supported: "%s", syntax highlighting will be disabled.`,
          val
        )
      }

      return acc.concat({title, value: val, mode})
    }, [])
  }, [type])

  const handleCodeChange = useCallback(
    (code: string) => {
      const path = PATH_CODE
      const fixedLanguage = type.options?.language

      onChange(
        setIfMissing({_type: type.name, language: fixedLanguage}),
        code ? set(code, path) : unset(path)
      )
    },
    [onChange, type]
  )

  const handleLanguageChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const val = event.currentTarget.value
      const path = PATH_LANGUAGE

      onChange(setIfMissing({_type: type.name}), val ? set(val, path) : unset(path))
    },
    [onChange, type.name]
  )

  const languages = getLanguageAlternatives().slice()

  const selectedLanguage = props?.value?.language
    ? languages.find((item: {value: string | undefined}) => item.value === props?.value?.language)
    : undefined

  const fixedLanguage = type.options?.language

  const language = value?.language || fixedLanguage

  // the language config from the schema
  const configured = languages.find((entry) => entry.value === language)

  // is the language officially supported (e.g. we import the mode by default)
  const supported = language && isSupportedLanguage(language)

  const mode = configured?.mode || (supported ? language : 'text')

  return (
    <FormFieldSet __unstable_changeIndicator={false} onSetCollapsed={() => console.warn('todo')}>
      <Stack space={3}>
        {languageFieldMember && (
          <FormNode fieldProps={languageFieldMember.field} renderField={renderField}>
            <FormField __internal_title={languageFieldMember.field.type.title || 'Language'}>
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
          </FormNode>
        )}

        {type.options?.withFilename && filenameMember && (
          <FormNode fieldProps={filenameMember.field} renderField={renderField}>
            <FormField __internal_title={filenameMember.field.type.title || 'Language'}>
              <TextInput
                name="filename"
                value={value?.filename || ''}
                placeholder={filenameMember.field.type.placeholder}
                onChange={handleFilenameChange}
                onFocus={handleFilenameFocus}
                onBlur={onBlur}
              />
            </FormField>
          </FormNode>
        )}

        {codeFieldMember && (
          <FormNode fieldProps={codeFieldMember.field} renderField={renderField}>
            <FormField __internal_title="Code">
              <EditorContainer radius={1} shadow={1} readOnly={readOnly}>
                <AceEditor
                  ref={aceEditorRef}
                  mode={mode}
                  theme={getTheme()}
                  width="100%"
                  onChange={handleCodeChange}
                  name={`editor-${id}`}
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
            </FormField>
          </FormNode>
        )}
      </Stack>
    </FormFieldSet>
  )
}
