/* eslint-disable no-console */
import React, {useCallback, useRef, useState} from 'react'
import {Text, Box, Card, Code} from '@sanity/ui'
import styled from 'styled-components'
import {
  PortableTextEditor,
  PortableTextEditable,
  RenderDecoratorFunction,
  EditorChange,
  RenderBlockFunction,
  RenderChildFunction,
  PortableTextBlock,
  RenderAttributes,
  EditorSelection,
} from '../../src'
import {applyAll} from '../../src/patch/applyPatch'
import {keyGenerator} from '../keyGenerator'
import {portableTextType} from '../schema'
import {Toolbar} from './Toolbar'

const HOTKEYS = {
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

type Props = {
  value: PortableTextBlock[] | undefined
  setValue: (value: PortableTextBlock[] | undefined) => void
}

/**
 * A basic standalone editor with hotkeys and value inspection
 */
export const Editor = ({value, setValue}: Props) => {
  const [selection, setSelection] = useState<EditorSelection>(null)
  const editor = useRef<PortableTextEditor>(null)

  const renderBlock: RenderBlockFunction = useCallback((block, type, attributes, defaultRender) => {
    const textType = PortableTextEditor.getPortableTextFeatures(editor.current).types.block
    // Text blocks
    if (type.name === textType.name) {
      return (
        <Box marginBottom={4}>
          <Text>{defaultRender(block)}</Text>
        </Box>
      )
    }
    // Object blocks
    return (
      <Card marginBottom={4}>
        <BlockObject {...attributes}>{JSON.stringify(block)}</BlockObject>
      </Card>
    )
  }, [])

  const renderChild: RenderChildFunction = useCallback(
    (child, type, _attributes, defaultRender) => {
      const textType = PortableTextEditor.getPortableTextFeatures(editor.current).types.span
      // Text spans
      if (type.name === textType.name) {
        return defaultRender(child)
      }
      // Inline objects
      return defaultRender(child)
    },
    []
  )

  const renderDecorator: RenderDecoratorFunction = useCallback(
    (mark, _mType, _attributes, defaultRender) => {
      switch (mark) {
        case 'strong':
          return <strong>{defaultRender()}</strong>
        case 'em':
          return <em>{defaultRender()}</em>
        case 'code':
          return <code>{defaultRender()}</code>
        case 'underline':
          return <u>{defaultRender()}</u>
        case 'strike-through':
          return <s>{defaultRender()}</s>
        default:
          return defaultRender()
      }
    },
    []
  )

  const handleChange = useCallback(
    (change: EditorChange): void => {
      switch (change.type) {
        case 'selection':
          setSelection(change.selection)
          break
        case 'mutation':
          console.log('Mutation', change.patches)
          setValue(applyAll(value, change.patches))
          break
        case 'patch':
          console.log('Patch', change.patch)
          break
        case 'blur':
        case 'focus':
        case 'invalidValue':
        case 'loading':
        case 'ready':
        case 'unset':
        case 'value':
        case 'throttle':
          break
        default:
          throw new Error(`Unhandled editor change ${JSON.stringify(change)}`)
      }
    },
    [value, setValue]
  )

  return (
    <PortableTextEditor
      ref={editor}
      type={portableTextType}
      onChange={handleChange}
      selection={selection}
      value={value}
      keyGenerator={keyGenerator}
      readOnly={false}
    >
      <Toolbar />
      <Box padding={4} style={{outline: '1px solid #999'}}>
        <PortableTextEditable
          placeholderText="Type here!"
          hotkeys={HOTKEYS}
          renderBlock={renderBlock}
          renderDecorator={renderDecorator}
          renderChild={renderChild}
          spellCheck
        />
      </Box>
      <Box padding={4} style={{outline: '1px solid #999'}}>
        <Code size={0} language="json">
          {JSON.stringify(selection)}
        </Code>
      </Box>
    </PortableTextEditor>
  )
}
