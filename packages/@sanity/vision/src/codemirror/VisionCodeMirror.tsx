import {useTheme} from '@sanity/ui'
import CodeMirror, {
  EditorSelection,
  type ReactCodeMirrorProps,
  type ReactCodeMirrorRef,
} from '@uiw/react-codemirror'
import {forwardRef, useCallback, useImperativeHandle, useRef, useState} from 'react'

import {codemirrorExtensions} from './extensions'
import {useCodemirrorTheme} from './useCodemirrorTheme'
import {EditorRoot} from './VisionCodeMirror.styled'

export interface VisionCodeMirrorHandle {
  resetEditorContent: (newContent: string) => void
}

export const VisionCodeMirror = forwardRef<
  VisionCodeMirrorHandle,
  Pick<ReactCodeMirrorProps, 'onChange'> & {
    initialValue: ReactCodeMirrorProps['value']
  }
>((props, ref) => {
  // The value prop is only passed for initial value, and is not updated when the parent component updates the value.
  // If you need to update the value, use the resetEditorContent function.
  const [initialValue] = useState(props.initialValue)
  const sanityTheme = useTheme()
  const theme = useCodemirrorTheme(sanityTheme)
  const codeMirrorRef = useRef<ReactCodeMirrorRef>(null)

  const resetEditorContent = useCallback((newContent: string) => {
    const editorView = codeMirrorRef.current?.view
    if (!editorView) return

    const currentDoc = editorView.state.doc.toString()
    if (newContent !== currentDoc) {
      editorView.dispatch({
        changes: {from: 0, to: currentDoc.length, insert: newContent},
        selection: EditorSelection.cursor(newContent.length), // Place cursor at end
      })
    }
  }, [])

  useImperativeHandle(
    ref,
    () => ({
      resetEditorContent,
    }),
    [resetEditorContent],
  )

  return (
    <EditorRoot>
      <CodeMirror
        ref={codeMirrorRef}
        basicSetup={false}
        theme={theme}
        extensions={codemirrorExtensions}
        value={initialValue}
        onChange={props.onChange}
      />
    </EditorRoot>
  )
})

// Add display name
VisionCodeMirror.displayName = 'VisionCodeMirror'
