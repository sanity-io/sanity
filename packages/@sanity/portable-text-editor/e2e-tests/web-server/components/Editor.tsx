import React, {useCallback, useMemo, useRef, useState, useEffect} from 'react'
import {Text, Box, Card, Code, Heading} from '@sanity/ui'
import styled from 'styled-components'
import {Subject} from 'rxjs'
import {PortableTextBlock} from '@sanity/types'
import {
  BlockDecoratorRenderProps,
  BlockRenderProps,
  PortableTextEditor,
  PortableTextEditable,
  EditorChange,
  RenderBlockFunction,
  RenderChildFunction,
  EditorSelection,
  Patch,
  HotkeyOptions,
  BlockListItemRenderProps,
  BlockStyleRenderProps,
} from '../../../src'
import {createKeyGenerator} from '../keyGenerator'
import {portableTextType} from '../../schema'

export const HOTKEYS: HotkeyOptions = {
  marks: {
    'mod+b': 'strong',
    'mod+i': 'em',
  },
  custom: {
    'mod+-': (e, editor) => {
      e.preventDefault()
      PortableTextEditor.toggleList(editor, 'number')
    },
  },
}

export const BlockObject = styled.div<BlockRenderProps>`
  border: ${(props) => (props.focused ? '1px solid blue' : '1px solid transparent')};
  background: ${(props) => (props.selected ? '#eeeeff' : 'transparent')};
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
  patches$,
  selection,
}: {
  value: PortableTextBlock[] | undefined
  onMutation: (mutatingPatches: Patch[]) => void
  editorId: string
  patches$: Subject<{
    patches: Patch[]
    snapshot: PortableTextBlock[] | undefined
  }>
  selection: EditorSelection | null
}) => {
  const [selectionValue, setSelectionValue] = useState<EditorSelection | null>(selection)
  const selectionString = useMemo(() => JSON.stringify(selectionValue), [selectionValue])
  const editor = useRef<PortableTextEditor>(null)
  const keyGenFn = useMemo(() => createKeyGenerator(editorId.substring(0, 1)), [editorId])
  const [isOffline, setIsOffline] = useState(!window.navigator.onLine)
  const [readOnly, setReadOnly] = useState(false)

  const renderBlock: RenderBlockFunction = useCallback((props) => {
    const {value: block, schemaType, children} = props
    if (editor.current) {
      const textType = editor.current.schemaTypes.block
      // Text blocks
      if (schemaType.name === textType.name) {
        return (
          <Box marginBottom={4}>
            <Text style={{color: getRandomColor()}}>{children}</Text>
          </Box>
        )
      }
      // Object blocks
      return (
        <Card marginBottom={4}>
          <BlockObject {...props}>
            <>{JSON.stringify(block)}</>
          </BlockObject>
        </Card>
      )
    }
    return children
  }, [])

  const renderChild: RenderChildFunction = useCallback((props) => {
    const {schemaType, children} = props
    if (editor.current) {
      const textType = editor.current.schemaTypes.span
      // Text spans
      if (schemaType.name === textType.name) {
        return children
      }
      // Inline objects
    }
    return children
  }, [])

  const renderDecorator = useCallback((props: BlockDecoratorRenderProps) => {
    const {value: mark, children} = props
    switch (mark) {
      case 'strong':
        return <strong>{children}</strong>
      case 'em':
        return <em>{children}</em>
      case 'code':
        return <code>{children}</code>
      case 'underline':
        return <u>{children}</u>
      case 'strike-through':
        return <s>{children}</s>
      default:
        return children
    }
  }, [])

  const renderStyle = useCallback((props: BlockStyleRenderProps) => {
    return props.children
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
        case 'connection':
          if (change.value === 'offline') {
            setIsOffline(true)
          } else if (change.value === 'online') {
            setIsOffline(false)
          }
          break
        case 'blur':
        case 'focus':
        case 'invalidValue':
        case 'loading':
        case 'patch':
        case 'ready':
        case 'unset':
        case 'value':
          break
        default:
          throw new Error(`Unhandled editor change ${JSON.stringify(change)}`)
      }
    },
    [onMutation],
  )

  const renderListItem = useCallback((props: BlockListItemRenderProps) => {
    const {level, schemaType, value: listType, children} = props
    const listStyleType = schemaType.value === 'number' ? 'decimal' : 'inherit'
    return <li style={{listStyleType, paddingLeft: `${level * 10}pt`}}>{children}</li>
  }, [])

  const editable = useMemo(
    () => (
      <PortableTextEditable
        renderPlaceholder={renderPlaceholder}
        hotkeys={HOTKEYS}
        renderBlock={renderBlock}
        renderDecorator={renderDecorator}
        renderChild={renderChild}
        renderListItem={renderListItem}
        renderStyle={renderStyle}
        selection={selection}
        style={{outline: 'none'}}
        spellCheck
      />
    ),
    [renderBlock, renderChild, renderDecorator, renderListItem, renderStyle, selection],
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
      schemaType={portableTextType}
      onChange={handleChange}
      patches$={patches$}
      value={value}
      keyGenerator={keyGenFn}
      readOnly={isOffline || readOnly}
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
      <Box paddingTop={2}>
        <button type="button" onClick={handleToggleReadOnly}>
          Toggle readonly ({JSON.stringify(readOnly)})
        </button>
      </Box>
    </PortableTextEditor>
  )
}
