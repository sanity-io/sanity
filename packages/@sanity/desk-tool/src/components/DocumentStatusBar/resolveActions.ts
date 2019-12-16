// import customResolveActions from 'part:@sanity/desk-tool/resolve-document-actions?'
import {DeleteAction} from './actions/DeleteAction'
import {PublishAction} from './actions/PublishAction'
import {BAR, BAZ, FOO} from './actions/TestActions'
import {WriteTitleAction} from './actions/WriteTitleAction'

export function resolveActions(documentState) {
  const deleteme = documentState.draft && documentState.draft.title === 'deleteme'
  return [
    deleteme && DeleteAction,
    WriteTitleAction,
    PublishAction,
    FOO,
    BAR,
    BAZ,
    !deleteme && DeleteAction
  ].filter(Boolean)
}
