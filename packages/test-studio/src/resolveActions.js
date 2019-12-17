import {DeleteAction} from 'part:@sanity/base/document-actions'
import {createAction} from 'part:@sanity/base/actions/utils'

const TestAction = createAction(editState => {
  return {
    label: 'CUSTOM FOO ACTION DEFINED IN TEST STUDIO WOOHO'
  }
})

export function resolveActions(editState, type) {
  return [TestAction, DeleteAction]
}
