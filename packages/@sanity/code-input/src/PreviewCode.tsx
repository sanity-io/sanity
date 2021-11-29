import React, {useCallback, useEffect, useRef} from 'react'
import AceEditor from 'react-ace'
import {get} from 'lodash'
import styled from 'styled-components'
import {Box} from '@sanity/ui'
import {SUPPORTED_LANGUAGES, LANGUAGE_ALIASES, ACE_EDITOR_PROPS, ACE_SET_OPTIONS} from './config'
import createHighlightMarkers from './createHighlightMarkers'
import type {CodeInputType, CodeInputValue} from './types'
/* eslint-disable-next-line import/no-unassigned-import */
import './editorSupport'

const PreviewContainer = styled(Box)`
  position: relative;
`

const PreviewInner = styled(Box)`
  background-color: #272822;

  .ace_editor {
    box-sizing: border-box;
    cursor: default;
    pointer-events: none;
  }

  .ace_content {
    box-sizing: border-box;
    overflow: hidden;
  }
`

export interface PreviewCodeProps {
  type?: CodeInputType
  value?: CodeInputValue
}

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

export default function PreviewCode(props: PreviewCodeProps) {
  const aceEditorRef = useRef<any>()

  useEffect(() => {
    if (!aceEditorRef?.current) return

    const editor = aceEditorRef.current?.editor

    if (editor) {
      // Avoid cursor and focus tracking by Ace
      editor.renderer.$cursorLayer.element.style.opacity = 0
      editor.textInput.getElement().disabled = true
    }
  }, [])

  const handleEditorChange = useCallback(() => {
    // do nothing when the editor changes
  }, [])

  const {value, type} = props
  const fixedLanguage = get(type, 'options.language')
  const mode = isSupportedLanguage((value && value.language) || fixedLanguage) || 'text'

  return (
    <PreviewContainer>
      <PreviewInner padding={4}>
        <AceEditor
          ref={aceEditorRef}
          focus={false}
          mode={mode}
          theme="monokai"
          width="100%"
          onChange={handleEditorChange}
          maxLines={200}
          readOnly
          wrapEnabled
          showPrintMargin={false}
          highlightActiveLine={false}
          cursorStart={-1}
          value={(value && value.code) || ''}
          markers={
            value && value.highlightedLines
              ? createHighlightMarkers(value.highlightedLines)
              : undefined
          }
          tabSize={2}
          showGutter={false}
          setOptions={ACE_SET_OPTIONS}
          editorProps={ACE_EDITOR_PROPS}
        />
      </PreviewInner>
    </PreviewContainer>
  )
}
