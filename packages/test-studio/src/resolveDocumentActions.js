import * as DefaultActions from 'part:@sanity/base/document-actions'
import {createAction} from 'part:@sanity/base/actions/utils'

const TestAction = createAction(props => {
  return {
    label: 'A custom action',
    title: `An action that doesn't do anything particular`
  }
})

export default function resolveDocumentActions(editState, type) {
  return [...Object.values(DefaultActions), TestAction]
}
