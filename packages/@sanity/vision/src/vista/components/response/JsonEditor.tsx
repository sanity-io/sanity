import {Card, Label} from '@sanity/ui'
import {type ReactNode, useEffect, useRef} from 'react'
import {Box, Flex} from 'ui5'

import {paramsExtensions} from '../../../codemirror/extensions'
import {VisionCodeMirror, type VisionCodeMirrorHandle} from '../../../codemirror/VisionCodeMirror'
import {jsonEditorBox} from '../vista.css'

/**
 * A JSON editor whose text can also be replaced from outside, by a loaded document or a template.
 * It grows into the height its flex container leaves over.
 */
export function JsonEditor(props: {
  label: string
  testId: string
  value: string
  onChange: (text: string) => void
  /** Shown at the end of the label's row */
  actions?: ReactNode
}) {
  const {label, testId, value, onChange, actions} = props
  const editorRef = useRef<VisionCodeMirrorHandle>(null)
  const shown = useRef(value)
  // A new value from outside replaces the text; an edit made here is already in the editor
  useEffect(() => {
    if (value === shown.current) return
    shown.current = value
    editorRef.current?.resetEditorContent(value)
  }, [value])
  return (
    <Flex flexBasis="0%" flexDirection="column" flexGrow={1} gap={2} minHeight="0">
      <Flex alignItems="center" flexShrink={0} gap={2}>
        <Label muted size={0}>
          {label}
        </Label>
        <Box flexBasis="0%" flexGrow={1} />
        {actions}
      </Flex>
      <Card border className={jsonEditorBox} data-testid={testId} radius={2}>
        <VisionCodeMirror
          extensions={paramsExtensions}
          initialValue={value}
          onChange={(text) => {
            shown.current = text
            onChange(text)
          }}
          ref={editorRef}
          underHeader
        />
      </Card>
    </Flex>
  )
}
