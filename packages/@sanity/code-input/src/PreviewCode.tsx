import React, {useCallback, useEffect, useRef} from 'react'
import AceEditor from 'react-ace'
import styled from 'styled-components'
import {Box} from '@sanity/ui'
import {ACE_EDITOR_PROPS, ACE_SET_OPTIONS} from './config'
import createHighlightMarkers from './createHighlightMarkers'
import {CodeInputType, CodeInputValue} from './types'
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
  const fixedLanguage = type?.options?.language

  const mode = value?.language || fixedLanguage

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
