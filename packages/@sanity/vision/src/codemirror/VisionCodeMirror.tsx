import React from 'react'
import {useTheme} from '@sanity/ui'
import CodeMirror, {ReactCodeMirrorProps} from '@uiw/react-codemirror'
import {codemirrorExtensions} from './extensions'
import {useCodemirrorTheme} from './useCodemirrorTheme'
import {EditorRoot} from './VisionCodeMirror.styled'

export function VisionCodeMirror(
  props: Omit<ReactCodeMirrorProps, 'basicSetup' | 'theme' | 'extensions'>
) {
  const sanityTheme = useTheme()
  const theme = useCodemirrorTheme(sanityTheme)

  return (
    <EditorRoot>
      <CodeMirror basicSetup={false} theme={theme} extensions={codemirrorExtensions} {...props} />
    </EditorRoot>
  )
}
