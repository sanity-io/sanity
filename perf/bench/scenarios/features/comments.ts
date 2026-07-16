import {type DocumentStore} from '../../mock-api/store'
import {type ScenarioStep} from '../types'

const COMMENT_KEYSTROKES = 64

function commentExists(store: DocumentStore): boolean {
  return store.getAll().some((doc) => doc._type === 'comment')
}

export function addCommentSteps(fieldPath: string): ScenarioStep[] {
  return [
    {kind: 'hover', selector: {testId: `field-${fieldPath}`}},
    {
      kind: 'click',
      label: 'open comment composer',
      selector: {testId: 'add-comment-button', within: `field-${fieldPath}`},
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
      oracle: commentExists,
    },
  ]
}
