import {portableText} from '../article'
import {type ScenarioStep} from '../types'

export function addCommentSteps(fieldPath: string, text: string): ScenarioStep[] {
  return [
    {kind: 'awaitVisible', selector: {field: fieldPath, kind: 'string'}},
    {
      kind: 'click',
      label: 'open comment composer',
      selector: {testId: 'add-comment-button', within: `field-${fieldPath}`},
    },
    {
      kind: 'type',
      label: 'comment body',
      selector: {testId: 'comment-input-editable'},
      text,
      oracle: (store) =>
        store
          .getAll()
          .some(
            (doc) =>
              doc._type === 'comment' &&
              portableText((doc as {message?: unknown}).message).includes(text),
          ),
    },
    {kind: 'click', label: 'send comment', selector: {testId: 'comment-input-send-button'}},
  ]
}
