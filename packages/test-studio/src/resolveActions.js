import {DeleteAction} from 'part:@sanity/desk-tool/default-actions'
import {createAction} from 'part:@sanity/base/util/document-action-utils'

const TestAction = createAction(editState => {
  return {
    label: 'CUSTOM FOO ACTION DEFINED IN TEST STUDIO WOOHO'
  }
})

export function resolveActions(editState, type) {
  return [TestAction, DeleteAction]
}
