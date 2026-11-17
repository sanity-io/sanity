import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {commentsUsEnglishLocaleBundle} from '../../i18n'
import {CommentDeleteDialog} from '../CommentDeleteDialog'
import {CommentInputDiscardDialog} from '../pte/comment-input/CommentInputDiscardDialog'

const NOOP = () => undefined
const DELETE_ERROR = new Error('delete failed')

export type CommentsDialogsStoryMode =
  | 'delete-comment'
  | 'delete-thread'
  | 'delete-error'
  | 'discard'

/**
 * Chromatic sentinel for comments-v2 delete and discard dialogs after the
 * ui5 Text/VStack migration. Critical confirm rows sit next to ui5 body
 * copy (and an optional critical error line) — a mix TypeScript will not
 * catch. Copy is locale-fixture only; no live comments, no loading spinner.
 */
function renderDialog(mode: CommentsDialogsStoryMode) {
  switch (mode) {
    case 'discard':
      return <CommentInputDiscardDialog onClose={NOOP} onConfirm={NOOP} />
    case 'delete-comment':
      return (
        <CommentDeleteDialog
          commentId="comment-1"
          error={null}
          isParent={false}
          loading={false}
          onClose={NOOP}
          onConfirm={NOOP}
        />
      )
    case 'delete-thread':
      return (
        <CommentDeleteDialog
          commentId="comment-1"
          error={null}
          isParent
          loading={false}
          onClose={NOOP}
          onConfirm={NOOP}
        />
      )
    case 'delete-error':
      return (
        <CommentDeleteDialog
          commentId="comment-1"
          error={DELETE_ERROR}
          isParent={false}
          loading={false}
          onClose={NOOP}
          onConfirm={NOOP}
        />
      )
    default: {
      const exhaustive: never = mode
      return exhaustive
    }
  }
}

export function CommentsDialogsStory(props: {mode: CommentsDialogsStoryMode}) {
  return (
    <TestWrapper i18nBundles={[commentsUsEnglishLocaleBundle]} schemaTypes={[]}>
      {renderDialog(props.mode)}
    </TestWrapper>
  )
}
