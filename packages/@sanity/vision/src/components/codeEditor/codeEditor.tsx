import {Card, CardProps} from '@sanity/ui'
import codemirror from 'codemirror'
// import isHotkey from 'is-hotkey'
import React, {useCallback, useEffect, useRef} from 'react'
import {Controlled as CodeMirror} from 'react-codemirror2'
import styled from 'styled-components'
// import {getCursor, getCursorOffset} from './helpers'
// import {runPrettier} from './prettier'
import {codeEditorStyle, codeEditorSyntax} from './styles'
import {CodeEditorCursor} from './types'

/* eslint-disable import/no-unassigned-import, import/no-unresolved */
import 'codemirror/addon/hint/show-hint.css?raw'
import 'codemirror/addon/hint/show-hint'
import 'codemirror/addon/edit/closebrackets'
import 'codemirror/lib/codemirror.css?raw'
import 'codemirror/mode/javascript/javascript'
/* eslint-enable import/no-unassigned-import, import/no-unresolved */

export interface CodeEditorProps extends CardProps {
  value: string
  cursor: CodeEditorCursor
  fontSize?: number | number[]
  language?: 'javascript' | 'json'
  onChange: (value: string) => void
  onCursorChange: (cursor: CodeEditorCursor) => void
}

const Root = styled(Card)(codeEditorStyle, codeEditorSyntax)

// const isSaveHotkey = isHotkey('mod+s')

export function CodeEditor(
  props: CodeEditorProps & Omit<React.HTMLProps<HTMLDivElement>, 'onChange'>
) {
  const {
    cursor,
    fontSize = 2,
    language = 'jsx',
    onChange,
    onCursorChange,
    value,
    ...restProps
  } = props
  const editorRef = useRef<codemirror.Editor | null>(null)
  const cursorRef = useRef(cursor)

  const handleCodeMirrorChange = useCallback(
    (editor: codemirror.Editor, change: codemirror.EditorChange, v: string) => {
      onChange(v)
    },
    [onChange]
  )

  const handleCursorActivity = useCallback(
    (editor: codemirror.Editor) => {
      const c = editor.getDoc().getCursor()
      const newCursor = {line: c.line, column: c.ch}
      // console.log('cursor', newCursor)
      onCursorChange(newCursor)
      cursorRef.current = newCursor
    },
    [onCursorChange]
  )

  // const handleKeyDown = useCallback(
  //   (event: React.KeyboardEvent<HTMLDivElement>) => {
  //     if (isSaveHotkey(event.nativeEvent)) {
  //       event.preventDefault()

  //       const cursorOffset = getCursorOffset(code, cursor)
  //       const result = runPrettier({code, cursorOffset})

  //       if (result) {
  //         let newVal = result.formatted
  //         let offset = result.cursorOffset

  //         if (newVal[0] === ';') {
  //           newVal = newVal.slice(1)
  //           offset -= 1
  //         }

  //         onCursorChange(getCursor(newVal, offset))
  //         onChange(newVal)
  //       }
  //     }
  //   },
  //   [code, cursor, onChange, onCursorChange]
  // )

  useEffect(() => {
    if (!editorRef.current) return undefined

    if (cursor.line !== cursorRef.current.line || cursor.column !== cursorRef.current.column) {
      editorRef.current.getDoc().setCursor({line: cursor.line, ch: cursor.column})
    }

    return undefined
  }, [cursor])

  return (
    <Root
      {...restProps}
      size={fontSize}
      // onKeyDown={handleKeyDown}
    >
      <CodeMirror
        onBeforeChange={handleCodeMirrorChange}
        onCursorActivity={handleCursorActivity}
        options={{mode: language}}
        value={value}
      />
    </Root>
  )
}
