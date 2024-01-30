/* eslint-disable max-nested-callbacks */
/* eslint-disable no-restricted-imports */
/* eslint-disable react/jsx-no-bind */
import {EditorChange, PortableTextEditable, PortableTextEditor} from '@sanity/portable-text-editor'
import {Schema} from '@sanity/schema'
import {defineField, defineArrayMember, PortableTextBlock} from '@sanity/types'
import {Button, Card, Code, Container, Flex, Stack, Text} from '@sanity/ui'
import {uuid} from '@sanity/uuid'
import {useCallback, useMemo, useRef, useState} from 'react'
import {
  buildCommentThreadItems,
  buildRangeDecorators,
  buildTextSelectionFromFragment,
} from '../utils'
import {CommentDocument} from '../types'
import {useCurrentUser} from 'sanity'

const INLINE_STYLE: React.CSSProperties = {outline: 'none'}

const INITIAL_VALUE: PortableTextBlock[] = [
  {
    _key: '6222e4072b6e',
    children: [
      {
        _type: 'span',
        marks: [],
        text: 'The passage is attributed to an unknown typesetter in the 15th century who is thought to have scrambled parts of. ',
        _key: '9d9c95878a6e0',
      },
    ],
    markDefs: [],
    _type: 'block',
    style: 'normal',
  },
  {
    _key: 'f0de711f24bd',
    markDefs: [],
    _type: 'block',
    style: 'normal',
    children: [
      {
        _type: 'span',
        marks: [],
        _key: 'a9a55f97580a',
        text: "Cicero's De Finibus Bonorum et Malorum for use in a type specimen book. It usually begins with.",
      },
    ],
  },
]

const blockType = defineField({
  type: 'block',
  name: 'block',
  of: [],
  marks: {
    annotations: [],
    decorators: [
      {
        title: 'Strong',
        value: 'strong',
        component: ({children}) => <span>{children}</span>,
      },
    ],
  },
  styles: [{title: 'Normal', value: 'normal'}],
  lists: [],
})

const portableTextType = defineArrayMember({
  type: 'array',
  name: 'body',
  of: [blockType],
})

const pteSchema = Schema.compile({
  name: 'body',
  types: [portableTextType],
})

const schema = Schema.compile({
  name: 'article',
  types: [
    {
      name: 'article',
      type: 'document',
      fields: [
        {
          name: 'body',
          type: 'array',
          of: [
            {
              type: 'block',
            },
          ],
        },
      ],
    },
  ],
})

export default function CommentInlineHighlightDebugStory() {
  const [value, setValue] = useState<PortableTextBlock[]>(INITIAL_VALUE)
  const [commentDocuments, setCommentDocuments] = useState<CommentDocument[]>([])
  const [hasSelectedRange, setHasSelectedRange] = useState<boolean>(false)
  const editorRef = useRef<PortableTextEditor | null>(null)
  const currentUser = useCurrentUser()

  const [currentHoveredCommentId, setCurrentHoveredCommentId] = useState<string | null>(null)

  const comments = useMemo(() => {
    if (!currentUser) return []

    // Build comment thread items here so that we can test the validation of each comment
    // since that is done in the `buildCommentThreadItems` function.
    return buildCommentThreadItems({
      comments: commentDocuments,
      currentUser,
      schemaType: schema.get('article'),
      documentValue: {
        _id: 'foo',
        _type: 'article',
        body: value,
      },
    })
  }, [commentDocuments, currentUser, value])

  const rangeDecorations = useMemo(
    () =>
      buildRangeDecorators({
        comments,
        value,
        onDecoratorHoverStart: setCurrentHoveredCommentId,
        onDecoratorHoverEnd: setCurrentHoveredCommentId,
        currentHoveredCommentId,
        onDecoratorClick: () => {
          // ...
        },
      }),
    [comments, currentHoveredCommentId, value],
  )

  const handleChange = useCallback((change: EditorChange) => {
    if (change.type === 'patch' && editorRef.current) {
      const editorStateValue = PortableTextEditor.getValue(editorRef.current)

      setValue(editorStateValue || [])
    }

    if (change.type === 'selection') {
      setHasSelectedRange(change.selection?.anchor.offset !== change.selection?.focus.offset)
    }
  }, [])

  const handleAddComment = useCallback(() => {
    if (!editorRef.current) return
    const fragment = PortableTextEditor.getFragment(editorRef.current) || []

    const selection = buildTextSelectionFromFragment({fragment})

    if (!selection) return

    const comment: CommentDocument = {
      _createdAt: new Date().toISOString(),
      _id: uuid(),
      _rev: 'foo',
      _type: 'comment',
      authorId: currentUser?.id || '',
      message: null,
      reactions: [],
      status: 'open',
      threadId: uuid(),
      target: {
        documentType: 'article',
        path: {
          field: 'body',
          selection: {
            type: 'text',
            value: selection.value,
          },
        },
        document: {
          _dataset: 'foo',
          _projectId: 'foo',
          _ref: 'foo',
          _type: 'crossDatasetReference',
          _weak: false,
        },
      },
    }

    setCommentDocuments((prev) => [...prev, comment])
  }, [currentUser?.id])

  return (
    <Flex align="center" justify="center" height="fill" sizing="border" overflow="hidden">
      <Card flex={1} height="fill" borderRight overflow="auto">
        <Flex height="fill" padding={4}>
          <Container width={1}>
            <Stack space={2}>
              <Card padding={3} border style={{minHeight: 150}}>
                <Text>
                  <PortableTextEditor
                    onChange={handleChange}
                    value={value}
                    schemaType={pteSchema.get('body')}
                    ref={editorRef}
                  >
                    <PortableTextEditable
                      spellCheck={false}
                      style={INLINE_STYLE}
                      renderDecorator={(decoratorProps) => (
                        <strong>{decoratorProps.children}</strong>
                      )}
                      renderBlock={(blockProps) => (
                        <div style={{paddingBottom: '1em'}}>{blockProps.children}</div>
                      )}
                      tabIndex={0}
                      rangeDecorations={rangeDecorations}
                    />
                  </PortableTextEditor>
                </Text>
              </Card>

              <Flex gap={1}>
                <Button
                  text="Add comment"
                  onClick={handleAddComment}
                  disabled={!hasSelectedRange}
                  padding={2}
                  fontSize={1}
                />
                <Button
                  text="Clear comments"
                  onClick={() => setCommentDocuments([])}
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
          <Code size={0} language="typescript">
            {JSON.stringify(value, null, 2)}
          </Code>
        </Card>
      </Flex>

      <Flex direction="column" flex={1} height="fill" overflow="auto">
        <Card flex={1} padding={4} borderRight>
          <Code size={0} language="typescript">
            {JSON.stringify(comments, null, 2)}
          </Code>
        </Card>
      </Flex>

      <Flex direction="column" flex={1} height="fill" overflow="auto">
        <Card flex={1} padding={4}>
          <Code size={0} language="typescript">
            {JSON.stringify(rangeDecorations, null, 2)}
          </Code>
        </Card>
      </Flex>
    </Flex>
  )
}
