import EditAction from './EditAction'
import DeleteAction from './DeleteAction'
import DuplicateAction from './DuplicateAction'
import WriteFieldAction from './WriteFieldAction'
import PolicyBasedReview from './PolicyBasedReview'
import PublishAction from './PublishAction'
import AsyncAction from './AsyncAction'
import UselessAction from './UselessAction'
import SaveAction from './SaveAction'
import ObservableAction from './ObservableAction'
import WrappedAction from './WrappedAction'

const DISABLE_CREATE = ['author']

export default function resolveDocumentActions(docInfo, type) {
  return [
    // type.__experimental_actions.includes('delete') && DeleteAction,
    // EditAction,
    // SaveAction,
    DeleteAction,
    // UselessAction,
    // AsyncAction,
    // ObservableAction,
    // WriteFieldAction,
    WrappedAction
    // PublishAction,
    // PolicyBasedReview
  ].filter(Boolean)
}
