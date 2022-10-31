import React, {useCallback, useMemo, useRef, useState, useEffect} from 'react'
import {Text, Box, Card, Code} from '@sanity/ui'
import styled from 'styled-components'
import {Subject} from 'rxjs'
import {PortableTextBlock} from '@sanity/types'
import {
  PortableTextEditor,
  PortableTextEditable,
  RenderDecoratorFunction,
  EditorChange,
  RenderBlockFunction,
  RenderChildFunction,
  RenderAttributes,
  EditorSelection,
  Patch,
} from '../../../src'
import {createKeyGenerator} from '../keyGenerator'
import {portableTextType} from '../../schema'

export const HOTKEYS = {
  marks: {
    'mod+b': 'strong',
    'mod+i': 'em',
  },
}

export const BlockObject = styled.div`
  border: ${(props: RenderAttributes) =>
    props.focused ? '1px solid blue' : '1px solid transparent'};
  background: ${(props: RenderAttributes) => (props.selected ? '#eeeeff' : 'transparent')};
  padding: 2em;
`

function getRandomColor() {
  const letters = '0123456789ABCDEF'
  let color = '#'
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)]
  }
  return color
}

const renderPlaceholder = () => 'Type here!'

export const Editor = ({
  value,
  onMutation,
  editorId,
  incomingPatches$,
  selection,
}: {
  value: PortableTextBlock[] | undefined
  onMutation: (mutatingPatches: Patch[]) => void
  editorId: string
  incomingPatches$: Subject<{
    patches: Patch[]
    snapshot: PortableTextBlock[] | undefined
  }>
  selection: EditorSelection | null
}) => {
  const [selectionValue, setSelectionValue] = useState<EditorSelection | null>(selection)
  const selectionString = useMemo(() => JSON.stringify(selectionValue), [selectionValue])
  const editor = useRef<PortableTextEditor>(null)
  const keyGenFn = useMemo(() => createKeyGenerator(editorId.substring(0, 1)), [editorId])

  const renderBlock: RenderBlockFunction = useCallback((props) => {
    const {value: block, type, attributes, defaultRender} = props
    if (editor.current) {
      const textType = editor.current.types.block
      // Text blocks
      if (type.name === textType.name) {
        return (
          <Box marginBottom={4}>
            <Text style={{color: getRandomColor()}}>{defaultRender(props)}</Text>
          </Box>
        )
      }
      // Object blocks
      return (
        <Card marginBottom={4}>
          <BlockObject {...attributes}>{JSON.stringify(block)}</BlockObject>
        </Card>
      )
    }
    return defaultRender(props)
  }, [])

  const renderChild: RenderChildFunction = useCallback((props) => {
    const {type, defaultRender} = props
    if (editor.current) {
      const textType = editor.current.types.span
      // Text spans
      if (type.name === textType.name) {
        return defaultRender(props)
      }
      // Inline objects
    }
    return defaultRender(props)
  }, [])

  const renderDecorator: RenderDecoratorFunction = useCallback((props) => {
    const {value: mark, defaultRender} = props
    switch (mark) {
      case 'strong':
        return <strong>{defaultRender(props)}</strong>
      case 'em':
        return <em>{defaultRender(props)}</em>
      case 'code':
        return <code>{defaultRender(props)}</code>
      case 'underline':
        return <u>{defaultRender(props)}</u>
      case 'strike-through':
        return <s>{defaultRender(props)}</s>
      default:
        return defaultRender(props)
    }
  }, [])

  const handleChange = useCallback(
    (change: EditorChange): void => {
      switch (change.type) {
        case 'selection':
          setSelectionValue(change.selection)
          break
        case 'mutation':
          onMutation(change.patches)
          break
        case 'patch':
        case 'blur':
        case 'focus':
        case 'invalidValue':
        case 'loading':
        case 'ready':
        case 'unset':
        case 'value':
          break
        default:
          throw new Error(`Unhandled editor change ${JSON.stringify(change)}`)
      }
    },
    [onMutation]
  )

  const [readOnly, setReadOnly] = useState(false)

  const editable = useMemo(
    () => (
      <PortableTextEditable
        renderPlaceholder={renderPlaceholder}
        hotkeys={HOTKEYS}
        renderBlock={renderBlock}
        renderDecorator={renderDecorator}
        renderChild={renderChild}
        selection={selection}
        spellCheck
      />
    ),
    [renderBlock, renderChild, renderDecorator, selection]
  )

  // Make sure that the test editor is focused and out of "readOnly mode".
  useEffect(() => {
    if (editor.current) {
      PortableTextEditor.focus(editor.current)
    }
  }, [editor])

  const handleToggleReadOnly = useCallback(() => {
    setReadOnly(!readOnly)
  }, [readOnly])

  if (!editorId) {
    return null
  }

  return (
    <PortableTextEditor
      ref={editor}
      type={portableTextType}
      onChange={handleChange}
      incomingPatches$={incomingPatches$}
      value={value}
      keyGenerator={keyGenFn}
      readOnly={readOnly}
    >
      <Box padding={4} style={{outline: '1px solid #999'}}>
        {editable}
      </Box>
      <Box padding={4} style={{outline: '1px solid #999'}}>
        <Code
          as="code"
          size={0}
          language="json"
          id="pte-selection"
          data-selection={selectionString}
        >
          {selectionString}
        </Code>
      </Box>
      {editor.current && (
        <Box padding={4} style={{outline: '1px solid #999'}}>
          <Code
            as="code"
            size={0}
            language="json"
            id="pte-slate-children"
            data-children={JSON.stringify(editor.current.slateInstance.children)}
          >
            {JSON.stringify(editor.current.slateInstance.children)}
          </Code>
        </Box>
      )}
      <Box paddingTop={2}>
        <button type="button" onClick={handleToggleReadOnly}>
          Toggle readonly ({JSON.stringify(readOnly)})
        </button>
      </Box>
    </PortableTextEditor>
  )
}
