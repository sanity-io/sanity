import {createLazyComponent} from '../components/lazy/createLazyComponent'
import {type CommentsListProps} from './components/list/CommentsList'

/**
 * @hidden
 * @beta
 */
export const CommentsList = createLazyComponent<CommentsListProps>(() =>
  import('./publicComponents.lazy').then((module) => ({default: module.CommentsList})),
)
