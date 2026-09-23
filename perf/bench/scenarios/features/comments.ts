import {type DocumentStore} from '../../mock-api/store'
import {type ScenarioStep} from '../types'

/**
 * Long enough that one pass drives more interactions than INP mode's target,
 * so the session stops after a single pass. That is a hard requirement, not a
 * tuning choice: posting the first comment swaps the field button from the
 * compose popover to a count button that opens the existing thread, so a
 * second pass would find no "Add comment" affordance at all.
 * `__tests__/comments.test.ts` guards the arithmetic.
 */
const COMMENT_KEYSTROKES = 64

/** Accessible name of the add-comment field button (comments `field-button.aria-label-add`). */
const ADD_COMMENT_LABEL = 'Add comment'

function commentPosted(store: DocumentStore): boolean {
  return store.getAll().some((doc) => doc._type === 'comment')
}

/**
 * The first-comment choreography on a field: reveal the hover-gated button,
 * open the composer, type a comment, send it. Two interactions carry the
 * cost — the composer click, which mounts a Portable Text editor inside a
 * popover, and the send click, which commits through the addon-dataset
 * client AND mounts the comments inspector pane (`handleCommentAdd` calls
 * `onCommentsOpen`), so a regression attributed to "send" may live in the
 * pane, not the mutation.
 *
 * Requires the `comments` mock feature module (see mock-api/features);
 * without it the button still clicks but the composer never opens.
 */
export function addCommentSteps(fieldPath: string): ScenarioStep[] {
  return [
    // The button only renders while the field is hovered.
    {kind: 'hover', selector: {testId: `field-${fieldPath}`}},
    {
      kind: 'click',
      label: 'open comment composer',
      selector: {label: ADD_COMMENT_LABEL, within: `field-${fieldPath}`},
    },
    {
      kind: 'type',
      label: 'comment body',
      selector: {testId: 'comment-input-editable'},
      keystrokes: COMMENT_KEYSTROKES,
    },
    {
      kind: 'click',
      label: 'send comment',
      selector: {testId: 'comment-input-send-button'},
      readback: commentPosted,
    },
  ]
}
