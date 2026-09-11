import {createLazyComponent} from '../components/lazy/createLazyComponent'

// Code-split facades for the comments components that `sanity` exports. The comments UI brings
// the Portable Text editor with it, which nothing renders before a document is opened; the
// plugin itself already loads its pieces lazily, so these wrappers only cover direct imports of
// the public components.

export const CommentsList = createLazyComponent(() =>
  import('./components/list/CommentsList').then((module) => module.CommentsList),
)

export const CommentsProvider = createLazyComponent(() =>
  import('./context/comments/CommentsProvider').then((module) => module.CommentsProvider),
)
