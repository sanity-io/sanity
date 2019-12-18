import * as DefaultActions from 'part:@sanity/base/document-actions'
import {createAction} from 'part:@sanity/base/actions/utils'

const TestAction = createAction(editState => {
  return {
    label: 'CUSTOM FOO ACTION DEFINED IN TEST STUDIO WOOHO'
  }
})

export default function resolveDocumentActions(editState, type) {
  return [...Object.values(DefaultActions), TestAction]
}
