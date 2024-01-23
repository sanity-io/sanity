/* eslint-disable max-nested-callbacks */
/* eslint-disable no-restricted-imports */
/* eslint-disable react/jsx-no-bind */
import {toPlainText} from '@portabletext/react'
import {
  DIFF_DELETE,
  DIFF_EQUAL,
  DIFF_INSERT,
  cleanupEfficiency,
  makeDiff,
} from '@sanity/diff-match-patch'
import {
  EditorChange,
  EditorSelection,
  PortableTextEditable,
  PortableTextEditor,
  RangeDecoration,
} from '@sanity/portable-text-editor'
import {Schema} from '@sanity/schema'
import {
  defineField,
  defineArrayMember,
  PortableTextBlock,
  isPortableTextTextBlock,
  PortableTextTextBlock,
  isPortableTextSpan,
} from '@sanity/types'
import {Button, Card, Code, Container, Flex, Stack, Text} from '@sanity/ui'
import {uuid} from '@sanity/uuid'
import {fuzzy} from 'fast-fuzzy'
import {flatten} from 'lodash'
import {PropsWithChildren, useCallback, useMemo, useRef, useState} from 'react'

const CHILD_SYMBOL = '\uF0D0'
const INLINE_STYLE: React.CSSProperties = {outline: 'none'}

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
  const [hasSelectedRange, setHasSelectedRange] = useState<boolean>(false)

  const editorRef = useRef<PortableTextEditor | null>(null)

  const handleChange = useCallback((change: EditorChange) => {
    if (change.type === 'patch' && editorRef.current) {
      const editorStateValue = PortableTextEditor.getValue(editorRef.current)

      setValue(editorStateValue || [])
    }

    if (change.type === 'selection') {
      setHasSelectedRange(change.selection?.anchor.offset !== change.selection?.focus.offset)
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

  const rangeDecorations = useCommentRanges(value, comments)

  return (
    <Flex align="center" justify="center" height="fill" sizing="border" overflow="hidden">
      <Card flex={0.75} height="fill" borderRight overflow="auto">
        <Flex height="fill" padding={4}>
          <Container width={1}>
            <Stack space={2}>
              <Card padding={3} border style={{minHeight: 150}}>
                <Text>
                  <PortableTextEditor
                    onChange={handleChange}
                    value={value}
                    schemaType={schema.get('body')}
                    ref={editorRef}
                  >
                    <PortableTextEditable
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
                  onClick={handleAddRange}
                  disabled={!hasSelectedRange}
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
            {JSON.stringify(rangeDecorations, null, 2)}
          </Code>
        </Card>
      </Flex>
    </Flex>
  )
}

function toPlainTextWithChildSeparators(inputBlock: PortableTextTextBlock) {
  return inputBlock.children.map((child) => child.text).join(CHILD_SYMBOL)
}

function buildSegments(fromInput: string, toInput: string): any[] {
  const segments: unknown[] = []
  const dmpDiffs = cleanupEfficiency(makeDiff(fromInput, toInput))

  let fromIdx = 0
  let toIdx = 0
  for (const [op, text] of dmpDiffs) {
    switch (op) {
      case DIFF_EQUAL:
        segments.push({
          type: 'stringSegment',
          action: 'unchanged',
          text,
        })
        fromIdx += text.length
        toIdx += text.length
        break
      case DIFF_DELETE:
        segments.push({
          type: 'stringSegment',
          action: 'removed',
          text: fromInput.substring(fromIdx, fromIdx + text.length),
          annotation: null,
        })
        fromIdx += text.length
        break
      case DIFF_INSERT:
        segments.push({
          type: 'stringSegment',
          action: 'added',
          text: toInput.substring(toIdx, toIdx + text.length),
          annotation: null,
        })
        toIdx += text.length
        break
      default:
      // Do nothing
    }
  }
  return flatten(segments)
}

function CommentDecorator(props: PropsWithChildren<{commentId: string}>) {
  const {children, commentId} = props
  return (
    <span
      data-inline-comment-state="added"
      data-inline-comment-id={commentId}
      style={{backgroundColor: '#fc0', color: '#000'}}
    >
      {children}
    </span>
  )
}

function useCommentRanges(value: PortableTextBlock[] | undefined, comments: Comment[]) {
  return useMemo((): RangeDecoration[] => {
    if (!value || value.length === 0) return []
    const decorators = flatten(
      comments.map((comment) => {
        const decoratorRanges = flatten(
          comment.selection.map((range) => {
            const matchedBlock = value.find((block) => block._key === range._key)
            if (!matchedBlock || !isPortableTextTextBlock(matchedBlock)) {
              return []
            }
            const positions: EditorSelection[] = []
            let isMatched = false
            if (typeof range.text === 'string') {
              const text = toPlainTextWithChildSeparators(matchedBlock)
              const matchData = fuzzy(range.text, text, {returnMatchData: true})
              const matchPosition = matchData.match.index

              const childIndicatorRegex = new RegExp(
                CHILD_SYMBOL.replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1'),
                'g',
              )
              if (matchPosition > -1 && matchData.score > 0.8) {
                isMatched = true
                const segments = buildSegments(text, range.text)
                let childIndex = 0
                // eslint-disable-next-line max-nested-callbacks
                segments.forEach((segment) => {
                  if (segment.action === 'removed') {
                    const childIndicatorMatches = segment.text.match(childIndicatorRegex)
                    childIndex += childIndicatorMatches ? childIndicatorMatches.length : 0
                  }
                  if (segment.action === 'unchanged') {
                    const childIndicatorMatches = segment.text.match(childIndicatorRegex)
                    childIndex += childIndicatorMatches ? childIndicatorMatches.length : 0
                  }
                })
                positions.push({
                  anchor: {
                    path: [
                      {_key: matchedBlock._key},
                      'children',
                      {_key: matchedBlock.children[childIndex]._key},
                    ],
                    offset:
                      matchPosition -
                      matchedBlock.children
                        .slice(0, childIndex)
                        .map((child) => (isPortableTextSpan(child) ? child.text.length : 0))
                        .reduce((a, b) => a + b, 0) -
                      childIndex,
                  },
                  focus: {
                    path: [
                      {_key: matchedBlock._key},
                      'children',
                      {_key: matchedBlock.children[childIndex]._key},
                    ],
                    offset:
                      matchPosition -
                      matchedBlock.children
                        .slice(0, childIndex)
                        .map((child) => (isPortableTextSpan(child) ? child.text.length : 0))
                        .reduce((a, b) => a + b, 0) -
                      childIndex +
                      range.text.length,
                  },
                })
                return positions
              }
            }
            const fallbackToWholeBlockWhenUnmatchedText = true
            if ((!isMatched && fallbackToWholeBlockWhenUnmatchedText) || !range.text) {
              let endOffset = 0
              const lastChild = matchedBlock.children[matchedBlock.children.length - 1]
              if (isPortableTextSpan(lastChild)) {
                endOffset = lastChild.text.length
              }
              positions.push({
                anchor: {
                  path: [
                    {_key: matchedBlock._key},
                    'children',
                    {_key: matchedBlock.children[0]._key},
                  ],
                  offset: 0,
                },
                focus: {
                  path: [
                    {_key: matchedBlock._key},
                    'children',
                    {_key: matchedBlock.children[matchedBlock.children.length - 1]._key},
                  ],
                  offset: endOffset,
                },
              })
              return positions
            }
            return []
          }),
        )

        return decoratorRanges.map(
          (range) =>
            ({
              component: ({children}) => (
                <CommentDecorator commentId={comment._id}>{children}</CommentDecorator>
              ),
              isRangeInvalid: () => false,
              selection: range,
            }) as RangeDecoration,
        )
      }),
    )

    return decorators
  }, [comments, value])
}
