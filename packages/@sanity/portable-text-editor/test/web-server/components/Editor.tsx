/* eslint-disable no-console */
import React, {useCallback, useMemo, useRef, useState} from 'react'
import {Text, Box, Card, Code} from '@sanity/ui'
import styled from 'styled-components'
import {Subject} from 'rxjs'
import {
  PortableTextEditor,
  PortableTextEditable,
  RenderDecoratorFunction,
  EditorChange,
  RenderBlockFunction,
  RenderChildFunction,
  RenderAttributes,
  EditorSelection,
  PortableTextBlock,
  Patch,
} from '../../../src'
import {createKeyGenerator} from '../keyGenerator'
import {portableTextType} from '../schema'

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

export const Editor = ({
  value,
  onMutation,
  editorId,
  incomingPatches$,
}: {
  value: PortableTextBlock[] | undefined
  onMutation: (mutatingPatches: Patch[]) => void
  editorId: string
  incomingPatches$: Subject<Patch>
}) => {
  const [selection, setSelection] = useState<EditorSelection>(null)
  const editor = useRef<PortableTextEditor>(null)
  const keyGenFn = useMemo(() => createKeyGenerator(editorId), [editorId])

  const renderBlock: RenderBlockFunction = useCallback((block, type, attributes, defaultRender) => {
    if (editor.current) {
      const textType = PortableTextEditor.getPortableTextFeatures(editor.current).types.block
      // Text blocks
      if (type.name === textType.name) {
        return (
          <Box marginBottom={4}>
            <Text style={{color: getRandomColor()}}>{defaultRender(block)}</Text>
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
    return defaultRender(block)
  }, [])

  const renderChild: RenderChildFunction = useCallback(
    (child, type, _attributes, defaultRender) => {
      if (editor.current) {
        const textType = PortableTextEditor.getPortableTextFeatures(editor.current).types.span
        // Text spans
        if (type.name === textType.name) {
          return defaultRender(child)
        }
        // Inline objects
      }
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
          onMutation(change.patches)
          break
        case 'patch':
          // console.log('Patch', change.patch)
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
    [onMutation]
  )

  if (!editorId) {
    return null
  }

  return (
    <PortableTextEditor
      ref={editor}
      type={portableTextType}
      onChange={handleChange}
      value={value}
      keyGenerator={keyGenFn}
      readOnly={false}
      incomingPatches$={incomingPatches$}
    >
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
        <Code size={0} language="json" id="pte-selection">
          {JSON.stringify(selection)}
        </Code>
      </Box>
    </PortableTextEditor>
  )
}
