/* eslint-disable max-nested-callbacks,react/jsx-no-bind */
import {
  type EditorChange,
  PortableTextEditable,
  PortableTextEditor,
  type RangeDecoration,
} from '@portabletext/editor'
import {Schema} from '@sanity/schema'
import {defineArrayMember, defineField, isKeySegment, type PortableTextBlock} from '@sanity/types'
import {Box, Button, Card, Code, Container, Flex, Label, Stack, Text} from '@sanity/ui'
import {uuid} from '@sanity/uuid'
import {isEqual} from 'lodash'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'

import {useCurrentUser} from '../../store/user/hooks'
import {type CommentDocument} from '../types'
import {buildCommentRangeDecorations} from '../utils/inline-comments/buildCommentRangeDecorations'
import {buildCommentThreadItems} from '../utils/buildCommentThreadItems'
import {buildTextSelectionFromFragment} from '../utils/inline-comments/buildTextSelectionFromFragment'

const INLINE_STYLE: React.CSSProperties = {outline: 'none'}

const INITIAL_VALUE: PortableTextBlock[] = [
  {
    _key: '3d4c655d6844',
    children: [
      {
        _type: 'span',
        marks: [],
        text: 'A floppy disk or floppy diskette (casually referred to as a floppy or a diskette) is a type of disk storage composed of a thin and flexible disk of a magnetic storage medium in a square or nearly square plastic enclosure lined with a fabric that removes dust particles from the spinning disk. Floppy disks store digital data which can be read and written when the disk is inserted into a floppy disk drive (FDD) connected to or inside a computer or other device.',
        _key: '0eec07fc05500',
      },
    ],
    markDefs: [],
    _type: 'block',
    style: 'normal',
  },
  {
    _key: '0252abaf4c95',
    children: [
      {
        _type: 'span',
        marks: [],
        text: 'The first floppy disks, invented and made by IBM, had a disk diameter of 8 inches (203.2 mm).[1] Subsequently, the 5¼-inch and then the 3½-inch (90 mm) became a ubiquitous form of data storage and transfer into the first years of the 21st century.[2] 3½-inch floppy disks can still be used with an external USB floppy disk drive. USB drives for 5¼-inch, 8-inch, and other-size floppy disks are rare to non-existent. Some individuals and organizations continue to use older equipment to read or transfer data from floppy disks.',
        _key: '887af29b60f70',
      },
    ],
    markDefs: [],
    _type: 'block',
    style: 'normal',
  },
  {
    _key: '042540219e8f',
    children: [
      {
        _type: 'span',
        marks: [],
        text: 'Floppy disks were so common in late 20th-century culture that many electronic and software programs continue to use save icons that look like floppy disks well into the 21st century, as a form of skeuomorphic design. While floppy disk drives still have some limited uses, especially with legacy industrial computer equipment, they have been superseded by data storage methods with much greater data storage capacity and data transfer speed, such as USB flash drives, memory cards, optical discs, and storage available through local computer networks and cloud storage.',
        _key: '14a1d1408eac0',
      },
    ],
    markDefs: [],
    _type: 'block',
    style: 'normal',
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
  const [canAddComment, setCanAddComment] = useState<boolean>(false)
  const editorRef = useRef<PortableTextEditor | null>(null)
  const currentUser = useCurrentUser()
  const [rangeDecorations, setRangeDecorations] = useState<RangeDecoration[]>([])

  const [currentHoveredCommentId, setCurrentHoveredCommentId] = useState<string | null>(null)

  const comments = useMemo(() => {
    if (!currentUser) return []

    // Build comment thread items here so that we can test the validation of each comment
    // since that is done in the `buildCommentThreadItems` function.
    return buildCommentThreadItems({
      type: 'field',
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

  const buildRangeDecorationsCallback = useCallback(
    () =>
      buildCommentRangeDecorations({
        comments: comments.map((c) => c.parentComment),
        value,
        onDecorationHoverStart: setCurrentHoveredCommentId,
        onDecorationHoverEnd: setCurrentHoveredCommentId,
        currentHoveredCommentId,
        onDecorationMoved: (details) => {
          const {rangeDecoration, newSelection} = details
          setRangeDecorations(buildRangeDecorationsCallback())
          const commentId = rangeDecoration.payload?.commentId as undefined | string
          const range = rangeDecoration.payload?.range as undefined | {_key: string; text: string}
          if (commentId && range) {
            let currentBlockKey = ''
            const previousBlockKey =
              rangeDecoration.selection &&
              isKeySegment(rangeDecoration.selection?.focus.path[0]) &&
              rangeDecoration.selection?.focus.path[0]?._key

            // Find out if the range has been moved to a different block
            if (
              newSelection?.focus.path[0] &&
              isKeySegment(newSelection.focus.path[0]) &&
              rangeDecoration.selection?.focus.path[0]
            ) {
              currentBlockKey = newSelection.focus.path[0]._key
            }
            setCommentDocuments((prev) => {
              return prev.map((comment) => {
                if (comment._id === commentId) {
                  const newComment = {
                    ...comment,
                    target: {
                      ...comment.target,
                      path: {
                        ...comment.target.path,
                        selection: {
                          type: 'text',
                          value: [
                            ...(comment.target.path?.selection?.value
                              .filter((r) => r._key !== range._key)
                              .concat(currentBlockKey ? {...range, _key: currentBlockKey} : [])
                              .flat() || []),
                          ],
                        },
                      },
                    },
                  } as CommentDocument
                  return newComment
                }
                return comment
              })
            })
          }
        },
        selectedThreadId: null,
        onDecorationClick: () => {
          // ...
        },
      }),
    [comments, currentHoveredCommentId, value],
  )

  const handleChange = useCallback(
    (change: EditorChange) => {
      if (change.type === 'patch' && editorRef.current) {
        const editorStateValue = PortableTextEditor.getValue(editorRef.current)

        setValue(editorStateValue || [])
      }

      // if (change.type === 'rangeDecorationMoved') {
      //   setRangeDecorations(buildRangeDecorationsCallback())
      //   const commentId = change.rangeDecoration.payload?.commentId as undefined | string
      //   const range = change.rangeDecoration.payload?.range as
      //     | undefined
      //     | {_key: string; text: string}
      //   if (commentId && range) {
      //     setCommentDocuments((prev) => {
      //       return prev.map((comment) => {
      //         if (comment._id === commentId) {
      //           const newComment = {
      //             ...comment,
      //             target: {
      //               ...comment.target,
      //               path: {
      //                 ...comment.target.path,
      //                 selection: {
      //                   type: 'text',
      //                   value: [
      //                     ...(comment.target.path.selection?.value
      //                       .filter((r) => r._key !== range._key)
      //                       .concat(range) || []),
      //                   ],
      //                 },
      //               },
      //             },
      //           } as CommentDocument
      //           return newComment
      //         }
      //         return comment
      //       })
      //     })
      //   }
      // }

      if (change.type === 'selection') {
        const overlapping = rangeDecorations.some((d) => {
          if (!editorRef.current) return false

          return PortableTextEditor.isSelectionsOverlapping(
            editorRef.current,
            change.selection,
            d.selection,
          )
        })

        const hasRange = change.selection?.anchor.offset !== change.selection?.focus.offset

        setCanAddComment(!overlapping && hasRange)
      }
    },
    [rangeDecorations],
  )

  useEffect(() => {
    setRangeDecorations((prev) => {
      const next = buildRangeDecorationsCallback()
      if (
        !isEqual(
          prev.map((d) => d.payload),
          next.map((d) => d.payload),
        )
      ) {
        return next
      }
      return prev
    })
  }, [buildRangeDecorationsCallback])

  const handleAddComment = useCallback(() => {
    if (!editorRef.current) return
    const fragment = PortableTextEditor.getFragment(editorRef.current) || []
    const editorSelection = PortableTextEditor.getSelection(editorRef.current)
    const editorValue = PortableTextEditor.getValue(editorRef.current)
    if (!editorValue) return

    const textSelection = buildTextSelectionFromFragment({
      fragment,
      value: editorValue,
      selection: editorSelection,
    })

    if (!textSelection) return

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
        documentRevisionId: '',
        documentType: 'article',
        path: {
          field: 'body',
          selection: {
            type: 'text',
            value: textSelection.value,
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
    setRangeDecorations(buildRangeDecorationsCallback())
  }, [buildRangeDecorationsCallback, currentUser?.id])

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
                  disabled={!canAddComment}
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
          <Box marginBottom={4}>
            <Label>Persisted Portable Text</Label>
          </Box>
          <Code size={0} language="typescript">
            {JSON.stringify(value, null, 2)}
          </Code>
        </Card>
      </Flex>

      <Flex direction="column" flex={1} height="fill" overflow="auto">
        <Card flex={1} padding={4} borderRight>
          <Box marginBottom={4}>
            <Label>Persisted comment object</Label>
          </Box>
          <Code size={0} language="typescript">
            {JSON.stringify(comments, null, 2)}
          </Code>
        </Card>
      </Flex>

      <Flex direction="column" flex={1} height="fill" overflow="auto">
        <Card flex={1} padding={4}>
          <Box marginBottom={4}>
            <Label>In-memory Portable Text Decorator Range</Label>
          </Box>
          <Code size={0} language="typescript">
            {JSON.stringify(rangeDecorations, null, 2)}
          </Code>
        </Card>
      </Flex>
    </Flex>
  )
}
