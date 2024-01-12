/* eslint-disable max-nested-callbacks */
import {
  EditorChange,
  EditorSelection,
  PortableTextEditor,
  RangeDecoration,
} from '@sanity/portable-text-editor'
import {Stack, Grid} from '@sanity/ui'
import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
  PropsWithChildren,
  Fragment,
} from 'react'
import {flatten, isEqual} from 'lodash'
import {uuid} from '@sanity/uuid'
import * as PathUtils from '@sanity/util/paths'
import {toPlainText} from '@portabletext/react'
import {block} from '@sanity/schema/src/legacy/types'
import {
  DIFF_DELETE,
  DIFF_EQUAL,
  DIFF_INSERT,
  cleanupEfficiency,
  cleanupSemantic,
  makeDiff,
  match,
} from '@sanity/diff-match-patch'
import {CommentMessage, CommentThreadItem, useComments, useCommentsEnabled} from '../../../src'
import {Button, PopoverProps} from '../../../../../ui-components'
import {createDomRectFromElements} from '../helpers'
import {select} from '../../../../panes/document/inspectDialog/helpers'
import {bitap} from '../bitap'
import {InlineCommentInputPopover} from './InlineCommentInputPopover'
import {HighlightSpan} from './HighlightSpan'

import {
  PortableTextBlock,
  PortableTextInputProps,
  PortableTextTextBlock,
  isKeySegment,
  isPortableTextSpan,
  isPortableTextTextBlock,
  useCurrentUser,
} from 'sanity'

const EMPTY_ARRAY: [] = []

// const CHILD_SYMBOL = '\uF0D0'
const CHILD_SYMBOL = '|'

function isRangeInvalid() {
  return false
}

function AddCommentDecorator(props: PropsWithChildren) {
  const {children} = props
  return <HighlightSpan data-inline-comment-state="authoring">{children}</HighlightSpan>
}

function CommentDecorator(props: PropsWithChildren<{commentId: string}>) {
  const {children, commentId} = props
  return (
    <HighlightSpan data-inline-comment-state="added" data-inline-comment-id={commentId}>
      {children}
    </HighlightSpan>
  )
}

export function CommentsPortableTextInput(props: PortableTextInputProps) {
  const isEnabled = useCommentsEnabled()

  if (!isEnabled) {
    return props.renderDefault(props)
  }

  return <CommentsPortableTextInputInner {...props} />
}

export const CommentsPortableTextInputInner = React.memo(function CommentsPortableTextInputInner(
  props: PortableTextInputProps,
) {
  const editorRef = useRef<PortableTextEditor>(null)
  const currentUser = useCurrentUser()
  const {mentionOptions, comments, create, edit} = useComments()

  const [nextCommentValue, setNextCommentValue] = useState<CommentMessage | null>(null)
  const [nextCommentSelection, setNextCommentSelection] = useState<EditorSelection | null>(null)
  const [currentSelectionPlainText, setCurrentSelectionPlainText] = useState<string | null>(null)

  const [canSubmit, setCanSubmit] = useState<boolean>(false)

  const currentSelectionRef = useRef<EditorSelection | null>(null)
  const rootElementRef = useRef<HTMLDivElement | null>(null)
  const [rect, setRect] = useState<DOMRect | null>(null)

  const stringFieldPath = useMemo(() => PathUtils.toString(props.path), [props.path])

  const fieldComments = useMemo(() => {
    return comments.data.open?.filter((comment) => comment.fieldPath === stringFieldPath)
  }, [comments, stringFieldPath])

  const handleSubmit = useCallback(() => {
    if (!nextCommentSelection) return

    create.execute({
      fieldPath: stringFieldPath,
      message: nextCommentValue,
      // This is a new comment, so we don't have a parent comment id
      parentCommentId: undefined,
      selection: nextCommentSelection,
      status: 'open',
      // This is a new comment, so we need to generate a new thread id
      threadId: uuid(),

      // TODO: add this
      // documentValueSnapshot: currentSelectionPlainText
    })

    // Reset the states when submitting
    setNextCommentValue(null)
    setNextCommentSelection(null) // Rename to setNextCommentSelection
    currentSelectionRef.current = null
  }, [create, nextCommentSelection, nextCommentValue, stringFieldPath])

  // This will set the current selection state to the current selection ref.
  // When this value is set, the popover with the comment input will open and
  // the comment being added will use the current selection in it's data.
  const handleAddSelection = useCallback(() => {
    setNextCommentSelection(currentSelectionRef.current)
  }, [])

  const handleDiscardConfirm = useCallback(() => {
    setNextCommentValue(null)
    setNextCommentSelection(null)
  }, [])

  const onClickOutsidePopover = useCallback(() => {
    setRect(null)
    setNextCommentSelection(null)
  }, [])

  const onEditorChange = useCallback(
    (change: EditorChange, editor: PortableTextEditor) => {
      if (change.type === 'rangeDecorationMoved') {
        const comment = change.rangeDecoration.payload?.comment as CommentThreadItem
        // console.log(
        //   `Decorator range changed affecting comment ${comment.parentComment._id}`,
        //   `From offset ${change.rangeDecoration?.selection?.focus?.offset} to ${change.newRangeSelection?.focus?.offset}`,
        // )
        edit.execute(comment.parentComment._id, {
          selection: change.newRangeSelection,
        })
        return
      }
      if (change.type === 'selection') {
        if (!PortableTextEditor.isExpandedSelection(editor)) {
          return
        }
        const hasSelectionRange = !isEqual(change.selection, nextCommentSelection)

        // TODO: the below seems like a bit too much to do right here.
        // This callback function, especially for the frequently called selection change,
        // should only do the bare minimum. We should probably move this logic to a separate
        // function where the comment is created.

        if (hasSelectionRange) {
          // Store the current selection in a ref so that, when clicking the "add comment"
          // button, we use the selection and set it as the current selection state so that
          // the popover opens with the selection.
          currentSelectionRef.current = change.selection

          const valueAtRange = PortableTextEditor.getFragment(editor)
          const plainTextValue = valueAtRange ? toPlainText(valueAtRange) : null

          // Check if the selection is valid. A valid selection is a selection that only
          // contains text blocks. If the selection contains other types of blocks, we
          // should not allow the user to add a comment and we disable the "add comment"
          // button.
          const isValidSelection = valueAtRange?.every(isPortableTextTextBlock)

          setCanSubmit(Boolean(isValidSelection))
          setCurrentSelectionPlainText(plainTextValue)
        } else {
          currentSelectionRef.current = null
          setCurrentSelectionPlainText(null)
          setCanSubmit(false)
        }
      }
    },
    [edit, nextCommentSelection],
  )

  // The range decorations for existing comments
  const commentDecorators = useMemo((): RangeDecoration[] => {
    const decorators = flatten(
      fieldComments.map((comment) => {
        if (!editorRef.current) return []
        if (!comment.selection) return []
        const key =
          isKeySegment(comment.selection.anchor.path[0]) && comment.selection.anchor.path[0]._key
        if (!key) return []
        const commentRanges = [
          {
            path: [{_key: key}],
            start: comment.selection.anchor.offset,
            text: 'one hyperlink to another without explicitly closing',
          },
        ]

        const decoratorRanges = flatten(
          commentRanges.map((range) => {
            if (!editorRef.current) return []
            const [matchedBlock, matchedPath] = PortableTextEditor.findByPath(
              editorRef.current,
              range.path,
            )
            if (!matchedBlock || !isPortableTextTextBlock(matchedBlock)) {
              return []
            }
            const text = toPlainTextWithNodeSeparators(matchedBlock)
            const matchPosition = bitap(text, range.text, 0, {distance: 4000}) // TODO: this is from diff-match-patch but with more bits!

            const regex = new RegExp(CHILD_SYMBOL.replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1'), 'g')
            const childStartMatch = text.substring(0, matchPosition).match(regex)?.length || 0

            const positions: EditorSelection[] = []
            if (matchPosition > -1) {
              const segments = buildSegments(text, range.text)
              let childIndex = 0
              segments.forEach((segment) => {
                if (segment.action === 'removed') {
                  const matches = segment.text.match(regex)
                  childIndex += matches ? matches.length : 0
                }
                if (segment.action === 'unchanged') {
                  const matches = segment.text.match(regex)
                  childIndex += matches ? matches.length : 0
                }
              })
              positions.push({
                anchor: {
                  path: [
                    {_key: matchedBlock._key},
                    'children',
                    {_key: matchedBlock.children[childStartMatch]._key},
                  ],
                  offset: matchPosition,
                },
                focus: {
                  path: [
                    {_key: matchedBlock._key},
                    'children',
                    {_key: matchedBlock.children[childStartMatch]._key},
                  ],
                  offset: matchPosition + range.text.length,
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
                <CommentDecorator commentId={comment.parentComment._id}>
                  {children}
                </CommentDecorator>
              ),
              isRangeInvalid,
              selection: range,
              payload: {comment},
            }) as RangeDecoration,
        )
      }),
    )

    return decorators
  }, [fieldComments])

  const rangeDecorations = useMemo((): RangeDecoration[] => {
    const currentRangeDecoration: RangeDecoration = {
      component: AddCommentDecorator,
      isRangeInvalid,
      selection: nextCommentSelection,
    }

    const currentDecorator = nextCommentSelection ? [currentRangeDecoration] : EMPTY_ARRAY
    const result = [
      // Existing range decorations
      ...(props?.rangeDecorations || EMPTY_ARRAY),
      // The range decoration when adding a comment
      ...currentDecorator,
      // The range decorations for existing comments
      ...commentDecorators,
    ]
    if (result.length > 0) {
      return result
    }
    return EMPTY_ARRAY
  }, [commentDecorators, nextCommentSelection, props?.rangeDecorations])

  // Construct a virtual element used to position the popover relative to the selection.
  const popoverReferenceElement = useMemo((): PopoverProps['referenceElement'] => {
    if (!rect) return null

    return {
      getBoundingClientRect: () => rect,
    } as HTMLElement
  }, [rect])

  // The props passed to the portable text input
  const inputProps = useMemo(
    (): PortableTextInputProps => ({
      ...props,
      editorRef,
      onEditorChange,
      rangeDecorations,
    }),
    [props, onEditorChange, rangeDecorations],
  )

  // This effect will run when the current selection changes and will calculate the
  // bounding box for the selection and set it as the rect state. This is used to
  // position the popover.
  useEffect(() => {
    // Get all the elements that have the `data-inline-comment-state="authoring"` attribute
    const elements = rootElementRef.current?.querySelectorAll(
      '[data-inline-comment-state="authoring"]',
    )

    // Create a DOMRect from the elements. This is used to position the popover.
    const nextRect = createDomRectFromElements(Array.from(elements || EMPTY_ARRAY))

    const raf = requestAnimationFrame(() => {
      setRect(nextRect)
    })

    return () => {
      cancelAnimationFrame(raf)
    }
  }, [nextCommentSelection])

  return (
    <Fragment key={stringFieldPath}>
      <Stack space={2} ref={rootElementRef}>
        {currentUser && (
          <InlineCommentInputPopover
            currentUser={currentUser}
            mentionOptions={mentionOptions}
            onChange={setNextCommentValue}
            onClickOutside={onClickOutsidePopover}
            onDiscardConfirm={handleDiscardConfirm}
            onSubmit={handleSubmit}
            open={!!nextCommentSelection}
            referenceElement={popoverReferenceElement}
            value={nextCommentValue}
          />
        )}

        {props.renderDefault(inputProps)}

        <Grid columns={2} gap={2}>
          <Button
            text="Add comment"
            onClick={handleAddSelection}
            disabled={!canSubmit || !currentSelectionPlainText}
          />
        </Grid>
      </Stack>
    </Fragment>
  )
})

function toPlainTextWithNodeSeparators(inputBlock: PortableTextTextBlock) {
  return inputBlock.children.map((child) => child.text).join(CHILD_SYMBOL)
}

function buildSegments(fromInput: string, toInput: string): any[] {
  const segments: any[] = []
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
