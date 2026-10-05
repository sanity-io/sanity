import {
  type Editor,
  type EditorSelection,
  type RangeDecoration,
  useEditor,
} from '@portabletext/editor'
import {isEqualSelections} from '@portabletext/editor/utils'
import {
  type UseSDKCommentAuthoringOptions,
  useSDKCommentAuthoring,
} from '@portabletext/plugin-sdk-value'
import {type PropsWithChildren, useMemo, useState} from 'react'

import {type CommentSubmission} from './CommentComposer'

type InlineCommentDraft = {
  // Follows edits made while the composer is open; null once the text is deleted.
  range: EditorSelection
}

function DraftHighlight({children}: PropsWithChildren) {
  return <span className="collection-entry-comment-draft">{children}</span>
}

// `createInlineComment` anchors to the live selection, which may have moved since the draft started.
function selectDraftRange(editor: Editor, range: NonNullable<EditorSelection>) {
  if (isEqualSelections(editor.getSnapshot().context.selection, range)) return
  editor.send({type: 'select', at: range})
}

export function useInlineCommentDraft(options: UseSDKCommentAuthoringOptions) {
  const editor = useEditor()
  const {commentableSelection, createInlineComment} = useSDKCommentAuthoring(options)
  const [draft, setDraft] = useState<InlineCommentDraft | null>(null)
  const draftRange = draft?.range ?? null

  // Marks the commented text once focus moves to the composer and the native selection is gone.
  const draftDecorations = useMemo(
    (): RangeDecoration[] =>
      draftRange === null
        ? []
        : [
            {
              component: DraftHighlight,
              selection: draftRange,
              onMoved: ({newSelection}) =>
                setDraft((current) => (current === null ? null : {range: newSelection})),
            },
          ],
    [draftRange],
  )

  function startDraft() {
    setDraft({range: commentableSelection})
  }

  function discardDraft() {
    setDraft(null)
  }

  function submitDraft({message, commentId}: CommentSubmission) {
    if (draftRange === null) {
      return Promise.reject(
        new Error('The selected text was removed. Cancel and select the text again.'),
      )
    }
    selectDraftRange(editor, draftRange)
    return createInlineComment({message, commentId})
  }

  return {commentableSelection, draft, draftDecorations, startDraft, discardDraft, submitDraft}
}
