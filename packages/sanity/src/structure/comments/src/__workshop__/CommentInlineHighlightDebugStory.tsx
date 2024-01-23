/* eslint-disable no-restricted-imports */
/* eslint-disable react/jsx-no-bind */
import {toPlainText} from '@portabletext/react'
import {
  EditorChange,
  EditorSelection,
  PortableTextEditable,
  PortableTextEditor,
  RangeDecoration,
} from '@sanity/portable-text-editor'
import {Schema} from '@sanity/schema'
import {defineField, defineArrayMember, PortableTextBlock} from '@sanity/types'
import {Button, Card, Code, Container, Flex, Stack, Text} from '@sanity/ui'
import {uuid} from '@sanity/uuid'
import {set} from 'lodash'
import {useCallback, useMemo, useRef, useState} from 'react'

const INLINE_STYLE: React.CSSProperties = {outline: 'none'}

const blockType = defineField({
  type: 'block',
  name: 'block',
  of: [],
  marks: {
    annotations: [],
  },
  styles: [{title: 'Normal', value: 'normal'}],
  lists: [],
})

const portableTextType = defineArrayMember({
  type: 'array',
  name: 'body',
  of: [blockType],
})

const schema = Schema.compile({
  name: 'comments',
  types: [portableTextType],
})

interface Comment {
  selection: {
    text: string
    _key: string
  }[]
  _id: string
}

export default function CommentInlineHighlightDebugStory() {
  const [value, setValue] = useState<PortableTextBlock[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [currentSelection, setCurrentSelection] = useState<EditorSelection | null>(null)

  const editorRef = useRef<PortableTextEditor | null>(null)

  const handleChange = useCallback((change: EditorChange) => {
    if (change.type === 'patch' && editorRef.current) {
      const editorStateValue = PortableTextEditor.getValue(editorRef.current)

      setValue(editorStateValue || [])
    }

    if (change.type === 'selection') {
      const hasSelectedRange = change.selection?.anchor.offset !== change.selection?.focus.offset

      setCurrentSelection(hasSelectedRange ? change.selection : null)
    }
  }, [])

  const handleAddRange = useCallback(() => {
    if (!editorRef.current) return
    const fragment = PortableTextEditor.getFragment(editorRef.current)

    const selection = fragment?.map((node) => {
      return {
        text: toPlainText([node]),
        _key: node._key,
      }
    })

    if (!selection) return

    const comment: Comment = {
      _id: uuid(),
      selection,
    }

    setComments((prev) => [...prev, comment])
  }, [])

  const rangeDecoration = useMemo<RangeDecoration[]>(() => {
    return comments.map((comment) => {
      // TODO:
      // 1. Find the block that contains the comment
      // 2. Find the range of the comment by comparing the text of the block with the text of the comment
      // 3. Return a range decoration that highlights the text of the comment

      const {selection} = comment

      return {
        component: (decorationProps) => (
          <span style={{backgroundColor: 'red'}}>{decorationProps.children}</span>
        ),
        isRangeInvalid: () => true,
        selection: {
          anchor: {path: [0, 0], offset: 0},
          focus: {path: [0, 0], offset: 5},
        },
      }
    })
  }, [comments])

  return (
    <Flex align="center" justify="center" height="fill" sizing="border" overflow="hidden">
      <Card flex={0.75} height="fill" borderRight overflow="auto">
        <Flex height="fill" padding={4}>
          <Container width={1}>
            <Stack space={2}>
              <Card padding={3} border style={{minHeight: 150}}>
                <PortableTextEditor
                  onChange={handleChange}
                  value={value}
                  schemaType={schema.get('body')}
                  ref={editorRef}
                >
                  <PortableTextEditable
                    style={INLINE_STYLE}
                    renderChild={(childProps) => <Text>{childProps.children}</Text>}
                    renderBlock={(blockProps) => (
                      <Stack paddingBottom={4}>{blockProps.children}</Stack>
                    )}
                    tabIndex={0}
                    rangeDecorations={rangeDecoration}
                  />
                </PortableTextEditor>
              </Card>

              <Flex gap={1}>
                <Button
                  text="Add comment"
                  onClick={handleAddRange}
                  disabled={!currentSelection}
                  padding={2}
                  fontSize={1}
                />
                <Button
                  text="Clear comments"
                  onClick={() => setComments([])}
                  mode="bleed"
                  padding={2}
                  fontSize={1}
                />
              </Flex>
            </Stack>
          </Container>
        </Flex>
      </Card>

      <Flex direction="column" flex={1} height="fill">
        <Card flex={1} borderRight padding={4} overflow="auto">
          <Code size={1} language="typescript">
            {JSON.stringify(value, null, 2)}
          </Code>
        </Card>
      </Flex>

      <Flex direction="column" flex={1} height="fill" overflow="auto">
        <Card flex={1} padding={4} borderRight>
          <Code size={1} language="typescript">
            {JSON.stringify(comments, null, 2)}
          </Code>
        </Card>
      </Flex>

      <Flex direction="column" flex={1} height="fill" overflow="auto">
        <Card flex={1} padding={4}>
          <Code size={1} language="typescript">
            {JSON.stringify([], null, 2)}
          </Code>
        </Card>
      </Flex>
    </Flex>
  )
}
